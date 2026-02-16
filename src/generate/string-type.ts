export const generateStringUnionType = (typeName: string, ids: string[]): string => {
  if (ids.length === 0) {
    return `export type ${typeName} = never;\n`;
  }
  return (
    `export type ${typeName} =\n` +
    ids
      .map((id) => {
        return `  | '${id}'`;
      })
      .join('\n') +
    ';'
  );
};

export const generateEnumType = (typeName: string, ids: string[]): string => {
  const idList = ids.map((id) => `'${id}'`).join(', ');
  const idListVariable = typeName + 's';
  let output = '';
  output += `const ${idListVariable} = [` + idList + '] as const;\n';
  output += `export const ${typeName}Schema = z.enum(${idListVariable});\n`;
  output += `export type ${typeName} = z.infer<typeof ${typeName}Schema>;\n`;
  output += '\n';
  return output;
};
