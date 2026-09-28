module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      // Keep code samples in posts as written instead of applying this repo's style to them
      files: ['*.md', '*.mdx'],
      options: { embeddedLanguageFormatting: 'off' },
    },
  ],
}
