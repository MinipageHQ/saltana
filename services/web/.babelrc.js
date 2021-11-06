module.exports = {
  presets: ['next/babel'],
  plugins: [
    'macros',
    [
      'styled-components',
      {
        ssr: true,
        displayName: true,
      },
    ],
    '@kiwicom/orbit-components',
  ],
}
