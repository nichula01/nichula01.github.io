Add-Type -AssemblyName System.Drawing
$enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
function Save($bmp,$path,$quality){
  $q=New-Object System.Drawing.Imaging.EncoderParameters(1)
  $q.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]$quality)
  $bmp.Save($path,$enc,$q)
}
function CropTo($src,$dst,$cx,$cy,$cw,$ch,$ow,$oh,$quality){
  $i=[System.Drawing.Image]::FromFile((Resolve-Path $src))
  $b=New-Object System.Drawing.Bitmap($ow,$oh); $g=[System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'
  $g.PixelOffsetMode='HighQuality'; $g.CompositingQuality='HighQuality'
  $g.Clear([System.Drawing.Color]::White)
  $g.DrawImage($i,(New-Object System.Drawing.Rectangle(0,0,$ow,$oh)),(New-Object System.Drawing.Rectangle($cx,$cy,$cw,$ch)),[System.Drawing.GraphicsUnit]::Pixel)
  Save $b $dst $quality
  "{0,-34} {1}x{2}  from {3}x{4}" -f (Split-Path $dst -Leaf),$ow,$oh,$cw,$ch
  $g.Dispose();$b.Dispose();$i.Dispose()
}
$o=(Get-Location).Path + '\assets\img\research'
New-Item -ItemType Directory -Force -Path $o | Out-Null

# Medical AI - one fundus from the Graph-of-Differences retrieval-explanation figure
CropTo 'images/research/god_explanations_Fundes.jpg' "$o\tile-medical-ai.jpg" 3856 1486 678 424 960 600 84

# Remote Sensing - one high-resolution satellite scene from the Mamba-FCS qualitative figure
CropTo 'images/research/mambafcs_qualitative_ablation.jpg' "$o\tile-remote-sensing.jpg" 316 2176 772 483 960 600 84

# Scientific Computing - CFD velocity fields on the RespGeomLib airway Y-junction
CropTo 'images/fig8_new.png' "$o\tile-scientific-computing.jpg" 742 122 688 430 880 550 86

# ---- Selected-paper thumbnails (4:3, 360x270 = 3x a ~110px slot) ----------
# Graph-of-Differences: one chest X-ray with anatomy-graph nodes.
CropTo 'images/research/god_explanations__cxr.png' "$o\thumb-graph-of-differences.jpg" 78 805 522 392 360 270 86
# PROTON: the frozen vision-language pipeline from the architecture figure.
CropTo 'images/VLM OOD Architecture.png' "$o\thumb-proton.jpg" 0 0 3986 2990 360 270 86
# Mamba-FCS: encoder overview, including the real pre/post satellite inputs.
CropTo 'images/research/mambafcs_overview_architecture.jpg' "$o\thumb-mamba-fcs.jpg" 0 0 6586 4940 360 270 86
