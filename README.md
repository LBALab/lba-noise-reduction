# Little Big Adventure 1 Voice Noise Reduction

This is a tool to reduce the noise in the voice samples of Little Big Adventure 1. It is not perfect, but it does improve significantly the quality of the voice samples.

## Usage

1. You need to own the Classic version of Little Big Adventure 1 from [itch.io](https://itch.io/s/61876/adeline-software-collection), [Steam](https://store.steampowered.com/developer/2_21) or [GOG](https://www.gog.com/en/games?developers=2-21)
2. Place the contents of the game in the `data` folder like this:
    - `data/Little Big Adventure`
    - `data/Little Big Adventure/Common`
    - `data/Little Big Adventure/CommonClassic/Voices`
3. Run `npm install`
4. Run `npm start`

## Notes

The original ogg files existing in the `CommonClassic/Voices` folder will be overridden and de-noised as well. If you want to keep the original files, you can copy them to another folder before running the tool.

By default, the conversion does 3 passes, and you can change it in the `voiceConvertor` function. The first pass is the most important one, the others have small improvements.

New VOX packed files will be created in the `data/Little Big Adventure/CommonClassic/Voices` folder including the existing files in the `CommonClassic/Voices` folder.


## Credits

This tool is based on lba2remake.net package conversion.

Special Thanks to [2.21](https://www.2point21.com/) to allow us to modify the game files and used it in the new version of the game.
