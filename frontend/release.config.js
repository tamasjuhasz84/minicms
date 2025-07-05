export default {
  branches: ['master'],
  tagFormat: 'frontend-v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(frontend): ${nextRelease.version} [skip ci]',
      },
    ],
    '@semantic-release/github',
  ],
}
