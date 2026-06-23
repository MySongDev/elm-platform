import path from 'node:path'
import { cwd } from 'node:process'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export function createElmSvgIconsPlugin(iconDir: string): ReturnType<typeof createSvgIconsPlugin> {
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(cwd(), iconDir)],
    symbolId: 'icon-[name]',
    inject: 'body-last',
    customDomId: '__svg__icons__dom__',
    svgoOptions: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              removeUselessStrokeAndFill: false,
            },
          },
        },
        'removeDimensions',
        {
          name: 'removeAttrs',
          params: {
            attrs: ['fill', 'stroke', 'class', 'style', 'id'],
          },
        },
      ],
    },
  })
}
