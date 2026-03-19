import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'DriveNest',
    executableName: 'drivenest',
    icon: './assets/icons/logo',
    asar: true,
  },
  makers: [
    new MakerZIP({}, ['linux']),
    new MakerDeb({
      options: {
        maintainer: 'DriveNest Team',
        homepage: 'https://github.com/drivenest/drivenest',
        icon: './assets/icons/logo.png',
        categories: ['Network', 'Utility'],
      },
    }),
    new MakerRpm({
      options: {
        icon: './assets/icons/logo.png',
        categories: ['Network', 'Utility'],
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
