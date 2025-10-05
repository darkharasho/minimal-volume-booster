<img width="1200" alt="Untitled" src="https://github.com/user-attachments/assets/fcab9790-ba60-48be-b864-5f2533af34d4" />

# Minimal Volume Booster

A super minimalistic Chrome extension to amplify tab audio up to 600% with a sleek dark UI and a color-coded slider.

![Recording2025-08-25162153online-video-cutter com-ezgif com-crop](https://github.com/user-attachments/assets/53d02c72-c5bb-48b9-b6d4-694a7be0b960)

## Usage

### Chrome

1. Open `chrome://extensions` in Chrome and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder.
3. Use the popup slider to set the volume between 0% and 600%.
   The selected level is remembered per tab and reflected in an animated
    40‑bar meter grouped into four color sections that align with the
    slider’s gradient.

> The control is disabled on Chrome internal pages (e.g. `chrome://`) where
> content scripts cannot run.

### Firefox

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and choose `manifest.json` from this folder.
3. Adjust the slider in the popup to boost audio up to 600% with the same
   tab-specific persistence and visual feedback as in Chrome.

> Firefox temporarily loaded add-ons are removed when the browser restarts.
