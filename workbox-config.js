module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{js,css,html,png,gif,json}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};