import os from 'os';
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

const getBaseName = (fileName: string) => {
    return `${path.basename(fileName, path.extname(fileName))}`;
};

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
        const nameOnly = getBaseName(fileName);
        const file = fs.readFileSync(inputFile);
        if (file == null) {
            console.error(`File not found: ${inputFile}`);
            return;
        }
        const language = fileName.substring(0, 2);
        const hqrIn = HQR.fromArrayBuffer(toArrayBuffer(file));
        const hqrOut = new HQR();
        for (let j = 0; j < hqrIn.entries.length; j += 1) {
            const entry = hqrIn.entries[j];
            if (!entry) {
                console.log(`Skipping HQR entry #${j}`);
                hqrOut.entries.push(null);
                continue;
            }
            if (entry instanceof HQRVirtualEntry) {
                console.log(`Copying HQR virtual entry #${j}`);
                hqrOut.entries.push(
                    new HQRVirtualEntry(hqrOut, entry.target, entry.metadata),
                );
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
            hqrOut.entries.push(tgtEntry);
            removeFile(wavFilePath);
            removeFile(mp4FilePath);

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
                removeFile(hiddenWavFilePath);
                removeFile(hiddenMp4FilePath);
            }
        }

        const outputFile = `${outputPath}${nameOnly}.VOX`;
        fs.writeFileSync(outputFile, Buffer.from(hqrOut.toArrayBuffer()));
    }

    const getBasePath = (language) => `${outputPath}/${language}_VOICE/`;
    fs.rmdirSync(getBasePath('DE'), { recursive: true });
    fs.rmdirSync(getBasePath('EN'), { recursive: true });
    fs.rmdirSync(getBasePath('FR'), { recursive: true });
};

const samplesConvertor = async (game, num_passes = 3) => {
    const filePath = path.normalize(`./data/${game}/Common/SAMPLES.HQR`);
    const bitrate = 32;

    const file = fs.readFileSync(filePath);
    if (file == null) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const hqrIn = HQR.fromArrayBuffer(toArrayBuffer(file));
    const hqrOut = new HQR();
    for (let i = 0; i < hqrIn.entries.length; i += 1) {
        const entry = hqrIn.entries[i];
        if (!entry) {
            hqrOut.entries.push(null);
            console.log(`Skipping HQR entry #${i}`);
            continue;
        }
        if (entry instanceof HQRVirtualEntry) {
            console.log(`Copying HQR virtual entry #${i}`);
            hqrOut.entries.push(
                new HQRVirtualEntry(hqrOut, entry.target, entry.metadata),
            );
            continue;
        }
        console.log(`Processing HQR entry #${i}`);
        const ext = game === 'Little Big Adventure 2' ? 'wav' : 'voc';
        const wavFilePath = path.normalize(`${os.tmpdir()}/SAMPLE_${i}.${ext}`);
        const mp4FilePath = path.normalize(`${os.tmpdir()}/SAMPLE_${i}.ogg`);

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
        hqrOut.entries.push(tgtEntry);
        removeFile(wavFilePath);
        removeFile(mp4FilePath);
    }

    const outputFile = path.normalize(
        `./data/${game}/CommonClassic/SAMPLES.HQR`,
    );
    fs.writeFileSync(outputFile, Buffer.from(hqrOut.toArrayBuffer()));
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
        `-i "${inputFilePath}" -c:a libvorbis -af "afftdn=nt=w:tn=enabled" "${outputFilePath}"`,
    );
    removeFile(`${outputFilePath}.bak`);
};

const convert = async () => {
    await samplesConvertor('Little Big Adventure');
    await voiceConvertor('Little Big Adventure');
    await samplesConvertor('Little Big Adventure 2');
    await voiceConvertor('Little Big Adventure 2');
};

convert();
