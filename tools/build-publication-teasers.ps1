# Authoring-time generator for the publications page.
#
#   1. Paper teaser images  -> assets/img/publications/   (640x384, 5:3)
#   2. Venue logo web copies -> assets/img/venues/        (64px tall)
#
# Every teaser is a plain crop + fit of a genuine research figure already in
# this repository. Nothing is redrawn, recoloured, relabelled or generated.
# Sources are letterboxed onto the canvas rather than stretched, so no figure
# is ever distorted and no science is cropped away by the resize itself.
#
# Venue logos are re-encoded copies of logo files that were already in
# images/. No logo is drawn or invented here.
#
# Originals are never overwritten.
#
# Run from the repository root:  powershell -File tools/build-publication-teasers.ps1

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore, WindowsBase

$jpegEnc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }

# Matches --figure-bg in assets/css/site.css, so the baked letterbox is
# indistinguishable from the image box behind it.
$Ground = [System.Drawing.Color]::FromArgb(247, 247, 245)

function Save-Jpeg($bmp, $path, $quality) {
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($path, $jpegEnc, $p)
}

function New-Canvas($w, $h) {
  $b = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.PixelOffsetMode = 'HighQuality'
  $g.CompositingQuality = 'HighQuality'
  return @($b, $g)
}

# Several sources here are 30-50 megapixel originals, and GDI+ throws
# "Out of memory" when asked to sample a source rectangle that large. WICN
# (via WPF's BitmapDecoder) scales during decode instead, so the pixels never
# have to be materialised at full size. Returns the loaded bitmap and the
# factor its coordinates have been scaled by.
function Open-Source($path) {
  $full = (Resolve-Path $path).Path
  $probe = [System.Drawing.Image]::FromFile($full)
  $mp = [double]$probe.Width * $probe.Height / 1e6
  if ($mp -le 20) { return @($probe, 1.0) }

  $w0 = $probe.Width
  $probe.Dispose()

  # Long side down to ~5000px: still many times the 640px canvas, so the
  # resample below has plenty of detail to work from.
  $factor = [Math]::Min(1.0, 5000.0 / $w0)

  $fs = [System.IO.File]::OpenRead($full)
  try {
    $frame = ([System.Windows.Media.Imaging.BitmapDecoder]::Create(
      $fs, 'None', 'OnLoad')).Frames[0]
    $scaled = New-Object System.Windows.Media.Imaging.TransformedBitmap(
      $frame, (New-Object System.Windows.Media.ScaleTransform($factor, $factor)))
    $ms = New-Object System.IO.MemoryStream
    $png = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $png.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($scaled))
    $png.Save($ms)
    $ms.Position = 0
    return @([System.Drawing.Image]::FromStream($ms), $factor)
  } finally {
    $fs.Close()
  }
}

# Crop (cx,cy,cw,ch) out of $src and fit it, aspect preserved, onto a
# $ow x $oh canvas filled with $Ground. Crop coordinates are always given in
# the original's pixel space; they are rescaled here if the source had to be
# decoded down.
function Fit-Teaser($src, $dst, $cx, $cy, $cw, $ch, $ow, $oh, $quality) {
  $loaded = Open-Source $src
  $img = $loaded[0]
  $k = $loaded[1]
  if ($k -ne 1.0) {
    $cx = [int][Math]::Round($cx * $k); $cy = [int][Math]::Round($cy * $k)
    $cw = [int][Math]::Round($cw * $k); $ch = [int][Math]::Round($ch * $k)
  }

  $scale = [Math]::Min($ow / $cw, $oh / $ch)
  $dw = [int][Math]::Round($cw * $scale)
  $dh = [int][Math]::Round($ch * $scale)
  $dx = [int][Math]::Round(($ow - $dw) / 2)
  $dy = [int][Math]::Round(($oh - $dh) / 2)

  $c = New-Canvas $ow $oh
  $bmp = $c[0]; $g = $c[1]
  $g.Clear($Ground)

  # GDI+ intermittently throws a spurious "Out of memory" when the source
  # rectangle covers tens of megapixels and its native heap is fragmented by
  # the previous originals. Collecting and retrying clears it.
  for ($try = 1; $try -le 4; $try++) {
    try {
      $g.DrawImage($img,
        (New-Object System.Drawing.Rectangle($dx, $dy, $dw, $dh)),
        (New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)),
        [System.Drawing.GraphicsUnit]::Pixel)
      break
    } catch {
      if ($try -eq 4) { throw }
      [System.GC]::Collect()
      [System.GC]::WaitForPendingFinalizers()
      Start-Sleep -Milliseconds 250
    }
  }

  Save-Jpeg $bmp $dst $quality
  "{0,-40} {1}x{2} content {3}x{4}  from crop {5}x{6}" -f `
    (Split-Path $dst -Leaf), $ow, $oh, $dw, $dh, $cw, $ch

  $g.Dispose(); $bmp.Dispose(); $img.Dispose()

  # Several sources here are 30-50 megapixel originals. GDI+ holds their
  # decoded surfaces in native memory, and without an explicit collection
  # between them a later DrawImage fails with a spurious "Out of memory".
  [System.GC]::Collect()
  [System.GC]::WaitForPendingFinalizers()
}

# Resize a logo to a fixed pixel height, preserving aspect, on a transparent
# canvas. PNG out, so logos with their own background keep it.
function Fit-Logo($src, $dst, $targetH) {
  $img = [System.Drawing.Image]::FromFile((Resolve-Path $src).Path)
  $w = [int][Math]::Round($img.Width * $targetH / $img.Height)

  $c = New-Canvas $w $targetH
  $bmp = $c[0]; $g = $c[1]
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $w, $targetH)))
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  "{0,-40} {1}x{2}" -f (Split-Path $dst -Leaf), $w, $targetH

  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

$root = (Get-Location).Path
$pub = Join-Path $root 'assets\img\publications'
$ven = Join-Path $root 'assets\img\venues'
New-Item -ItemType Directory -Force -Path $pub | Out-Null
New-Item -ItemType Directory -Force -Path $ven | Out-Null

$W = 640; $H = 384   # 5:3, 2x the 220x132 desktop image box
$Q = 84

'--- paper teasers ---'

# Graph-of-Differences (MICCAI 2026). Same region as the research page's
# fig-graph-of-differences.jpg: the success and border query rows with their
# Rank-1 / Rank-2 retrievals and the anatomy-graph nodes.
Fit-Teaser 'images/research/god_explanations__cxr.png' "$pub\graph-of-differences.jpg" `
  28 0 2077 1310 $W $H $Q

# PROTON (MICCAI 2026). Same figure the homepage thumbnail uses, widened to
# take in the MCM scoring block beside the frozen vision-language pipeline.
Fit-Teaser 'images/VLM OOD Architecture.png' "$pub\proton.jpg" `
  0 0 4985 2990 $W $H $Q

# Controlled VSS benchmark (IGARSS 2026). Left of the pipeline figure: the
# LoveDA RGB input and the three encoder families entering the shared stages.
Fit-Teaser 'images/research/igarss2026_vss_benchmark_pipeline.png' "$pub\vss-benchmark.jpg" `
  0 0 2200 1320 $W $H $Q

# LoveDA long-tail augmentation (IGARSS 2026). The paper's Stage B training
# figure, fitted whole: cropping this pipeline would drop either the semantic
# map and prompt on the left or the diffusion loss on the right.
Fit-Teaser 'images/research/stageB.jpg' "$pub\loveda-longtail.jpg" `
  0 0 5055 2405 $W $H $Q

# Mamba-FCS (IEEE J-STARS). Same figure the homepage thumbnail uses, widened
# past the encoder: pre-/post-change inputs through the shared stages.
Fit-Teaser 'images/research/mambafcs_overview_architecture.jpg' "$pub\mamba-fcs.jpg" `
  0 0 8235 4940 $W $H $Q

# RespGeomLib (IEEE Mercon 2026). Same crop as the research page's
# fig-respgeomlib-airway.jpg: CT-derived reconstruction beside the
# procedural airway.
Fit-Teaser 'images/fig9_new (1).png' "$pub\respgeomlib.jpg" `
  15 18 1416 996 $W $H $Q

# Precision spatio-temporal fusion (ICIIS 2025). The whole qualitative
# figure: three scenes across pre-event, post-event, ground truth and the two
# prediction columns. The crop is the figure's measured content bounding box
# (204,144 - 3189,1902) padded to exactly 5:3, so the outer black margin is
# dropped and the panel fills the frame without a letterbox seam.
Fit-Teaser 'images/research/iciis2025_precision_spatiotemporal_qualitative.jpg' "$pub\iciis-precision-stf.jpg" `
  204 128 2986 1792 $W $H $Q

'--- venue logos (copies of logos already in images/) ---'

Fit-Logo 'images/igarss.png' "$ven\igarss.png" 64   # IGARSS 2026, Washington D.C.
Fit-Logo 'images/iciis.png' "$ven\iciis.png" 64     # ICIIS 2025
Fit-Logo 'images/jstars.png' "$ven\ieee-grss.png" 64 # IEEE GRSS, publisher of J-STARS

# No MICCAI logo and no IEEE Mercon logo exist in this repository, and
# AGENTS.md rule 9 forbids adding venue logos that are not already here and
# cleared for use. Those two venues fall back to the textual venue mark in
# publications.html until real logo files are supplied.
