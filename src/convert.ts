import fs from 'fs';
import path from 'path';
import FFmpeg from 'ffmpeg-cli';

import { CompressionType, HQR, HQREntry, HQRVirtualEntry } from '@lbalab/hqr';

const removeFile = (filename) => {
    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
    }
};

const createFolderIfNotExists = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

const toArrayBuffer = (b: Buffer) =>
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

const voiceConvertor = async (game, num_passes = 3) => {
    const folderPath = path.normalize(`./data/${game}/Common/Vox/`);
    const outputPath = path.normalize(`./data/${game}/CommonClassic/Voices/`);
    const files = fs.readdirSync(folderPath);
    const bitrate = 32;

    const filesToConvert = files.filter(
        (file) => path.extname(file).toLowerCase() === '.vox',
    );
    const size = filesToConvert.length;

    for (let i = 0; i < size; i += 1) {
        const fileName = filesToConvert[i];
        const inputFile = `${folderPath}${fileName}`;
        const file = fs.readFileSync(inputFile);
        if (file == null) {
            console.error(`File not found: ${inputFile}`);
            return;
        }
        const language = fileName.substring(0, 2);
        const hqrIn = HQR.fromArrayBuffer(toArrayBuffer(file));
        for (let j = 0; j < hqrIn.entries.length; j += 1) {
            const entry = hqrIn.entries[j];
            if (!entry) {
                console.log(`Skipping HQR entry #${j}`);
                continue;
            }
            if (entry instanceof HQRVirtualEntry) {
                console.log(`Copying HQR virtual entry #${j}`);
                continue;
            }
            console.log(`Processing HQR entry #${j}`);
            const baseName = path.basename(inputFile, '.VOX');
            const basePath = `${outputPath}/${language}_VOICE/${baseName}`;
            createFolderIfNotExists(basePath);
            const wavFilePath = path.normalize(
                `${basePath}/${baseName}_${j.toString().padStart(3, '0')}.wav`,
            );
            const mp4FilePath = path.normalize(
                `${basePath}/${baseName}_${j.toString().padStart(3, '0')}.ogg`,
            );

            // Restoring RIFF in header because LBA format has 0 instead of first R
            if (game === 'Little Big Adventure 2') {
                new Uint8Array(entry.content)[0] = 0x52;
            }
            // Fixed VOC first byte
            if (game === 'Little Big Adventure') {
                new Uint8Array(entry.content)[0] = 0x43;
            }
            fs.writeFileSync(wavFilePath, Buffer.from(entry.content));

            for (let k = 0; k < num_passes; k += 1) {
                await convertToM4aAudio(wavFilePath, mp4FilePath, bitrate);
            }
            const mp4File = fs.readFileSync(mp4FilePath);
            const tgtEntry = new HQREntry(
                toArrayBuffer(mp4File),
                CompressionType.NONE,
            );
            fs.unlinkSync(wavFilePath);

            for (let k = 0; k < entry.hiddenEntries.length; k += 1) {
                const hiddenEntry = entry.hiddenEntries[k];
                const hiddenWavFilePath = path.normalize(
                    `${basePath}/${baseName}_${j
                        .toString()
                        .padStart(3, '0')}_${k
                        .toString()
                        .padStart(2, '0')}.wav`,
                );
                const hiddenMp4FilePath = path.normalize(
                    `${basePath}/${baseName}_${j
                        .toString()
                        .padStart(3, '0')}_${k
                        .toString()
                        .padStart(2, '0')}.ogg`,
                );
                // Restoring RIFF in header because LBA format has 0 instead of first R
                if (game === 'Little Big Adventure 2') {
                    new Uint8Array(hiddenEntry.content)[0] = 0x52;
                }
                // Fixed VOC first byte
                if (game === 'Little Big Adventure') {
                    new Uint8Array(hiddenEntry.content)[0] = 0x43;
                }
                fs.writeFileSync(
                    hiddenWavFilePath,
                    Buffer.from(hiddenEntry.content),
                );

                // first pass
                for (let k = 0; k < num_passes; k += 1) {
                    await convertToM4aAudio(
                        hiddenWavFilePath,
                        hiddenMp4FilePath,
                        bitrate,
                    );
                }
                const hiddenMp4File = fs.readFileSync(hiddenMp4FilePath);
                const hiddenTgtEntry = new HQREntry(
                    toArrayBuffer(hiddenMp4File),
                    CompressionType.NONE,
                );
                tgtEntry.hiddenEntries.push(hiddenTgtEntry);
                fs.unlinkSync(hiddenWavFilePath);
            }
        }
    }
};

const convertToM4aAudio = async (
    inputFilePath: string,
    outputFilePath: string,
    bitrate: number,
) => {
    console.log(
        `Converting ${inputFilePath} to ${outputFilePath} with bitrate ${bitrate}k`,
    );
    if (fs.existsSync(outputFilePath)) {
        fs.copyFileSync(outputFilePath, `${outputFilePath}.bak`);
        inputFilePath = `${outputFilePath}.bak`;
    }
    removeFile(outputFilePath);
    FFmpeg.runSync(
        `-i "${inputFilePath}" -c:a libvorbis -b:a ${bitrate}k -af "afftdn=nt=w:tn=enabled" "${outputFilePath}"`,
    );
    removeFile(`${outputFilePath}.bak`);
};

voiceConvertor('Little Big Adventure');
