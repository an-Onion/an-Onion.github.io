import { readdirSync } from 'fs';

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(dirName => !['.git', '.vscode', 'node_modules'].includes(dirName));


getDirectories('.').forEach((dirName) => {
  const path = `./${dirName}`.replace(/ /g, '%20');
  console.log(`* [${dirName}](${path})`);
});

