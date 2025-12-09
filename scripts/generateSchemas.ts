import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesDir = path.resolve(__dirname, '../shared/types');
const outDir = path.resolve(__dirname, '../shared/schemas');
const outFile = path.join(outDir, "schemas.json")

console.log("Updating Schemas")
/** Path to file that changed */
let changed: string | undefined = undefined
process.argv.forEach(function (val, index) {
    if (index >= 2) {
        const splitPath = val.split(`\\`)
        changed = splitPath[splitPath.length-1]
    }
});

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function getExportedTypes(filePath: string): string[] {
    const source = ts.createSourceFile(
        filePath,
        fs.readFileSync(filePath, 'utf8'),
        ts.ScriptTarget.Latest,
        true
    );

    const exported: string[] = [];
    ts.forEachChild(source, node => {
        if (
            (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
            node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
            !node.typeParameters?.length // Exclude generic types
        ) {
            exported.push(node.name.text);
        }
    });
    return exported;
}

function getCurrentSchemasJson(): Record<string, any> {
    let schemas: Record<string, any> = {}
    try {
        schemas = JSON.parse(fs.readFileSync(outFile, "utf-8"));
    } catch (e: unknown) {
        return {}
    }
    console.log(Object.values(schemas).length)
    return schemas
}

// Fetch current schemas, or start from scratch if we're not just updating based on a changed file.
const fileSchema: Record<string, any> = changed ? getCurrentSchemasJson() : {};
// Iterate over files and update schema accordingly
fs.readdirSync(typesDir, { withFileTypes: true }).forEach(dirent => {
    const file = dirent.name;

    if (changed && file !== changed) return; // If we passed the name of a file that changed, and this isn't it, skip.
    if (!file.endsWith('.ts')) return; // skip declaration files

    const filePath = path.join(typesDir, file);
    const exportedTypes = getExportedTypes(filePath);

    if (exportedTypes.length === 0) return; // nothing to generate

    exportedTypes.forEach(typeName => {
        console.log(`Generating schema for ${typeName} in ${file}...`);
        const schemaJson = execSync(
            `ts-json-schema-generator --path "${filePath}" --type "${typeName}" --tsconfig tsconfig.json --expose export --jsDoc extended --no-type-check --additional-properties`,
            { encoding: 'utf-8' }
        );
        fileSchema[typeName] = JSON.parse(schemaJson);
    });
});

// Write a single JSON file with the all the schemas files
fs.writeFileSync(
    outFile,
    JSON.stringify(fileSchema, null, 2)
);
console.log("Schemas updated.")