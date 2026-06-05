export interface ScssOptions {
  mixinsPath: string
  variablesPath: string
}

export function createScssOptions(options: ScssOptions) {
  return {
    scss: {
      additionalData: `
        @use "${options.mixinsPath}" as *;
        @use "${options.variablesPath}" as *;
      `,
    },
  }
}
