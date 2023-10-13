# sm64js2020archive

### Links
[Main Website: sm64js.com](https://sm64js2020archive.000webhostapp.com/)


## What is this?
This is an ongoing work-in-progress port of the decompilation of original Nintendo game, Super Mario 64, to native Javascript (no emulation or web assembly). The project involved creating a Javascript WebGL port of N64 Fast 3D Renderer, originally implemented with OpenGL in C.  This project also includes the development of online mass multiplayer versions of sm64js and other custom multiplayer game modes, And a 2020 working version of sm64js.

## Basic instructions - Windows, Mac, or Linux
Windows:
On windows ubuntu do: cd /mnt/DRIVENAMEHERE for example if you have an E: drive do /mnt/e or if u only have C: drive do /mnt/c

Linux:
On LINUX ubuntu type: Documents and go to your documents so that it can be ready to git clone.

MAC:
For MAC Linux Virtual Machine/Windows Virtual Machine: If your on a linux virtual machine do this: Documents If your on a windows virtual machine do this: cd /mnt/c

## Build instructions, Windows, Mac, or Linux
```bash
/// Run these commands 1 at a time so it works
git clone https://github.com/sm64jsreboot/sm64jsrebooted.git ## Stay in the drive or folder you want!
cd sm64jsrebooted
git checkout betatesterversion
cd src

## Getting PHP8.1
sudo apt update
sudo apt install --no-install-recommends php8.1

// After its finished installing do
php -S localhost:9300
                             
