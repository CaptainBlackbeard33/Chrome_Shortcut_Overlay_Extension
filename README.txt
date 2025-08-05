# Chrome Shortcut Overlay Extension

**This is a Chrome extension that uses a toggle to show an overlay of all clickable links on your webpage. You can then navigate through links using a 2-letter key sequence.**

## FEATURES
- Customizable keyboard toggle (default: Ctrl + Alt)  
- Adjustable font size (8px - 32px)  
- Adjustable box size (12px - 80px)  
- Adjustable box color using color picker  
- Automatic font contrast, black or white, based on box color  
- Close overlay on inputting activation shortcut again, clicking, scrolling, changing a tab, or ESC  

## QUALITY OF LIFE
- Shortcut filtering (input a shortcut starting with A → shortcuts not starting with A disappear)  
- 2-key shortcut combinations are decided by link locations on webpage  
  - Links on left side of webpage use ASDF and nearby keys  
  - Links on right side of webpage use JKL and nearby keys  
- Warning for keyboard toggle shortcut conflict with Chrome and OS  

## SCREENSHOTS

<p align="center">
  <img src="Screenshots/sc1.png" width="45%" style="margin: 5px;">
  <img src="Screenshots/sc2.png" width="45%" style="margin: 5px;"><br>
  <img src="Screenshots/sc3.png" width="45%" style="margin: 5px;">
  <img src="Screenshots/sc4.png" width="45%" style="margin: 5px;">
</p>

## INSTALLATION
1. Open Chrome and go to `chrome://extensions/`  
2. Enable **Developer mode** in the top right corner  
3. Click **Load unpacked** and select this extension folder  
4. The extension icon will appear in your browser toolbar  

## HOW TO USE
1. Press your keyboard shortcut (default: Ctrl+Alt) on any webpage  
2. Colored boxes with letters will appear over clickable elements  
3. Type the letter sequence to click on an element  
4. Press Escape or click anywhere to hide the overlay  
5. Scrolling automatically hides the overlay  

## CUSTOMIZATION
Click the extension icon in your toolbar to open settings:

- **Keyboard Shortcut:** Record a new shortcut combination  
- **Font Size:** Adjust text size in the boxes (8-32px)  
- **Box Size:** Adjust the size of shortcut boxes (12-80px)  
- **Box Color:** Choose custom colors with the color picker or hex input  

## IMPORTANT NOTES
- Avoid using shortcuts that conflict with browser shortcuts (Ctrl+F, Ctrl+T, etc.)  
- Avoid OS shortcuts (Ctrl+Alt+Del, Win+R, etc.)  
- After changing settings, refresh the webpage to see updates  
- The extension automatically chooses black or white text for optimal readability  

## RECOMMENDED SHORTCUTS
Safe options that typically don't conflict:

- Ctrl+Alt (default)  
- Ctrl+Shift  
- Alt+Shift  
- Alt+Number keys (1-9)  

## TROUBLESHOOTING
- **If overlay doesn't appear:** Check that you're not on a Chrome internal page  
- **If shortcut doesn't work:** Try a different key combination  
- **If colors don't update:** Refresh the webpage after changing settings  
- **If extension stops working:** Disable and re-enable in `chrome://extensions/`  

## TECHNICAL DETAILS
- **Manifest Version:** 3  
- **Permissions:** `activeTab`, `storage`  
- **Works with:** All websites except `chrome://` pages  
- **Storage:** Settings sync across Chrome browsers when signed in  

## VERSION INFORMATION
- **Version:** 1.0  
- **Release Date:** 2025  
- **Compatibility:** Chrome browsers with Manifest V3 support  

