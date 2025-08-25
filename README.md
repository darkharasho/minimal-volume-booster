# Minimal Volume Booster

A super minimalistic Chrome extension to amplify tab audio up to 600% with a sleek dark UI and a color-coded slider inspired by the extension icon.

## Usage
1. Open `chrome://extensions` in Chrome and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Use the popup slider to set the volume between 0% and 600%.
   The selected level is remembered per tab and reflected in an animated
    40‑bar meter grouped into four color sections that align with the
    slider’s gradient.

> The control is disabled on Chrome internal pages (e.g. `chrome://`) where
> content scripts cannot run.

## Icons
To keep the repository free of binary files, icon PNGs are ignored. Generate them with [Pillow](https://python-pillow.org/) before loading the extension:

```bash
python icon_gen.py
```
