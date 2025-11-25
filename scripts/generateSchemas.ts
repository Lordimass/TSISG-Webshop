import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {fileURLToPath} from 'url';

/**
 * Refs to types that AJV won't understand in validation.
 */
const unsupportedRefs: string[] = ['#/definitions/Date']

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typesDir = path.resolve(__dirname, '../shared/types');
const outDir = path.resolve(__dirname, '../shared/schemas');
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

/**
 * Replace unsupported refs in schema definitions with `any` in order to prevent AJV from getting scared when it sees
 * things beyond its understanding.
 * @param obj
 */
function replaceUnsupportedRefs(obj: any) {
    if (Array.isArray(obj)) {
        // If there are more types defined here, recursively remove unsupported refs from those too
        obj.forEach(item => replaceUnsupportedRefs(item));
    } else if (typeof obj === 'object' && obj !== null) {
        // Replace unsupported $ref
        if (obj.$ref && unsupportedRefs.includes(obj.$ref)) {
            // Remove the $ref and treat as "any"
            delete obj.$ref;
        }

        // Recursively process properties
        Object.values(obj).forEach(v => replaceUnsupportedRefs(v));
    }
}

const fileSchema: Record<string, any> = {};
fs.readdirSync(typesDir, { withFileTypes: true }).forEach(dirent => {
    const file = dirent.name;

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
        //replaceUnsupportedRefs(fileSchema);
    });
});

// Write a single JSON file with the all the schemas files
fs.writeFileSync(
    path.join(outDir, `schemas.json`),
    JSON.stringify(fileSchema, null, 2)
);
