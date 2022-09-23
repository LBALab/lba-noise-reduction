# Little Big Adventure 1 Voice Noise Reduction

This is a tool to reduce the noise in the voice samples of Little Big Adventure 1. It is not perfect, but it does improve significantly the quality of the voice samples.

## Usage

1. You need to own the Classic version of Little Big Adventure 1 from [itch.io](https://itch.io/s/61876/adeline-software-collection), [Steam](https://store.steampowered.com/developer/2_21) or [GOG](https://www.gog.com/en/games?developers=2-21)
2. Place the contents of the game in the `data` folder like this:
    - `data/Little Big Adventure/Common`
    - `data/Little Big Adventure/CommonClassic/Voices`
3. Run `npm install`
4. Run `npm start`

## Notes

Please note, this current version is overriding any existing ogg files in the `CommonClassic/Voices` folder, so make sure you have a backup of the original files.

## Credits

This tool is based on lba2remake.net package conversion.
