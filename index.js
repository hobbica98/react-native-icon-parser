#!/usr/bin/env node

const {program} = require('commander');
const _ = require('lodash');
const fs = require('fs-extra');

//read file from path
const readFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
}

program
    .name('string-util')
    .description('CLI to some JavaScript string utilities')
    .version('1.0.1');

program.command('generate')
    .description('Generates font awesome icons from svgs')
    .requiredOption('--to <to>', 'Destination directory')
    .requiredOption('--from <from>', 'Path to custom icons js file (from font-awesome)')
    .action(async (args) => {
        const {to, from} = args;
        const data = await readFile(from);

        const icons = JSON.parse(`{${data.split('var icons = {')[1].split('};')[0]}}`)
        for (const [key, value] of Object.entries(icons)) {
            const icon = {
                name: key,
                path: value[4]
            }
            const template = await readFile('./templates/icon.ejs');
            const iconFile = template.replace(/<%-iconName%>/g, icon.name)
                .replace(/<%-path%>/g, icon.path)
                .replace(/<%-width%>/g, value[0])
                .replace(/<%-height%>/g, value[1])
                .replace(/<%-unicode%>/g, value[3])
                .replace(/<%-iconNamePascal%>/g, _.upperFirst(_.camelCase(icon.name)))


            await fs.writeFile(`${to}/${icon.name}.js`, iconFile);
        }
        const imports = Object.keys(icons).map(icon => `const fa${_.upperFirst(_.camelCase(icon))} = require('./${icon}');`).join('\n');
        const exports = Object.keys(icons).map(icon => `exports.fa${_.upperFirst(_.camelCase(icon))} = ${_.upperFirst(_.camelCase(icon))};`).join('\n');
        const iconCache =  Object.keys(icons).map(icon => `fa${_.upperFirst(_.camelCase(icon))}: ${_.upperFirst(_.camelCase(icon))},`).join('\n');
        const indexFile = (await readFile('./templates/index.ejs'))
            .replace(/<%-imports%>/g, imports)
            .replace(/<%-exports%>/g, exports)
            .replace(/<%-iconsCache%>/g, iconCache)
        await fs.writeFile(`${to}/index.js`, indexFile);
    });

program.parse();
