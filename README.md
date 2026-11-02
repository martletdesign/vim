# Martlet for Vim and Neovim

## Install

For Vim's native package loader:

```sh
git clone https://github.com/martlettheme/vim.git ~/.vim/pack/themes/start/martlet
```

For Neovim's native package loader:

```sh
git clone https://github.com/martlettheme/vim.git ~/.local/share/nvim/site/pack/themes/start/martlet
```

Or add `martlettheme/vim` to your plugin manager. The root `colors/` layout supports both editors.

```vim
set termguicolors
set background=dark
colorscheme martlet
```

Choose Light with `set background=light` before `colorscheme martlet`. Explicit names `martlet-light` and `martlet-dark` also work. Neovim Lua: `vim.cmd.colorscheme('martlet-dark')`. GUI/truecolor uses the exact canonical hex colors; 256-color terminals use nearest xterm approximations. Standard syntax, editor chrome, diffs, diagnostics, and Neovim Treesitter/LSP capture links are included. Requires Vim 8+ or Neovim 0.9+; exact capture coverage depends on parser/plugin versions.

For a manual installation, copy all three files from `colors/` into your editor's colors directory. Run tests with full Vim and Neovim installed.

These are generated distributions of [Martlet Theme](https://martlettheme.dev/), version 1.0.0. Canonical colors and generators live in [martlettheme/martlettheme](https://github.com/martlettheme/martlettheme). The source repository may require maintainer access. This repository includes a complete color snapshot in source.json and can build without access to that repository.

MIT license. Copyright 2026 James P. Howard, II.

## Maintenance

Edit the canonical palette and generator upstream, then run npm run build there. The complete distribution directories are emitted under artifacts/repositories/. Sync the relevant directory into this repository. To reproduce a snapshot here, run npm run build, then npm test. Node.js 22 or newer is used in CI. No registry publication runs automatically.

## Prepared release controls

The native tag-release workflow remains disabled. Its release-absence guard first
checks authenticated access to the exact repository, then accepts only GitHub's
JSON `Not Found` response for the exact tag. Existing releases, inaccessible
repositories, redirects, malformed responses, timeouts and API failures stop for
recovery. These checks do not grant or demonstrate production tag protection.
No store submission or automatic replacement of existing assets is authorized.
