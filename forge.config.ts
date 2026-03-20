import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerFlatpak } from '@electron-forge/maker-flatpak';
import { MakerAppImage } from '@reforged/maker-appimage';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import path from 'path';
import { execSync } from 'child_process';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'DriveNest',
    executableName: 'drivenest',
    icon: './assets/icons/logo',
    asar: true,
    extraResource: [
      './assets',
    ],
  },
  makers: [
    new MakerAppImage({
      options: {
        icon: './assets/icons/logo.png',
      },
    }),
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
    new MakerFlatpak({
      options: {
        id: 'com.drivenest.app',
        modules: [],
        files: [],
        runtime: 'org.freedesktop.Platform',
        runtimeVersion: '23.08',
        sdk: 'org.freedesktop.Sdk',
        base: 'org.electronjs.Electron2.BaseApp',
        baseVersion: '23.08',
        finishArgs: [
          '--share=ipc',
          '--share=network',
          '--socket=x11',
          '--socket=wayland',
          '--device=dri',
          '--filesystem=home',
        ],
      },
    }),
    new MakerZIP({}, ['linux']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
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
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion) => {
      console.log('Installing production dependencies in:', buildPath);
      
      const fs = require('fs');
      const rootPjson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
      
      // Create a packaged package.json with the same production dependencies
      const pjson = {
        name: rootPjson.name,
        version: rootPjson.version,
        dependencies: rootPjson.dependencies,
      };
      
      fs.writeFileSync(path.join(buildPath, 'package.json'), JSON.stringify(pjson, null, 2));

      // Install dependencies
      console.log('Running npm install --production...');
      execSync('npm install --production', {
        cwd: buildPath,
        stdio: 'inherit',
      });

      // Rebuild native modules
      console.log('Rebuilding native modules for Electron:', electronVersion);
      execSync(`npx @electron/rebuild -v ${electronVersion}`, {
        cwd: buildPath,
        stdio: 'inherit',
      });
    },
  },
};

export default config;
