# Authoring-time generator for the research page's three large editorial
# figures. Every output is a plain crop + resize of a genuine research figure
# already in this repository - nothing is redrawn, recoloured or relabelled.
# Originals are never overwritten.
#
# Run from the repository root:  powershell -File tools/build-research-figures.ps1

Add-Type -AssemblyName System.Drawing
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save($bmp, $path, $quality) {
  $q = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $q.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($path, $enc, $q)
}

function CropTo($src, $dst, $cx, $cy, $cw, $ch, $ow, $oh, $quality) {
  $i = [System.Drawing.Image]::FromFile((Resolve-Path $src).Path)
  $b = New-Object System.Drawing.Bitmap($ow, $oh)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.SmoothingMode = 'HighQuality'
  $g.PixelOffsetMode = 'HighQuality'
  $g.CompositingQuality = 'HighQuality'
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($i,
    (New-Object System.Drawing.Rectangle(0, 0, $ow, $oh)),
    (New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)),
    [System.Drawing.GraphicsUnit]::Pixel)
  Save $b $dst $quality
  "{0,-30} {1}x{2}  from {3}x{4} at ({5},{6})" -f (Split-Path $dst -Leaf), $ow, $oh, $cw, $ch, $cx, $cy
  $g.Dispose(); $b.Dispose(); $i.Dispose()
}

$o = (Get-Location).Path + '\assets\img\research'
New-Item -ItemType Directory -Force -Path $o | Out-Null

# --- Medical AI ------------------------------------------------------------
# Graph-of-Differences chest X-ray retrieval explanations. Crop keeps the query
# column plus Rank-1 and Rank-2 for the "success" and "border" query cases, so
# the per-region anatomy nodes and the correct/incorrect frames stay legible.
CropTo 'images/research/god_explanations__cxr.png' "$o\fig-graph-of-differences.jpg" `
  28 0 2077 1310 1400 883 86

# --- Remote sensing --------------------------------------------------------
# IGARSS 2026 controlled-benchmark qualitative comparison. Crop keeps the
# backbone column headers and the first two LoveDA scenes: satellite image,
# ground truth, per-backbone segmentation and the false-positive/negative maps.
CropTo 'images/research/igarss2026_vss_benchmark_qualitative.png' "$o\fig-remote-sensing-qualitative.jpg" `
  0 0 3185 1600 2000 1004 84

# --- Scientific computing --------------------------------------------------
# RespGeomLib: CT-derived airway reconstruction beside the procedural airway.
# Crop only trims the surrounding page whitespace.
CropTo 'images/fig9_new (1).png' "$o\fig-respgeomlib-airway.jpg" `
  15 18 1416 996 1400 985 88



