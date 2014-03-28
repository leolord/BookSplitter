var fs = require('fs'),
sl = require('split'),
path = require('path');
var splitter = [/^\s*第.+[章节卷].*/, /^[^,.，。、！？"“”…]+篇.*/, /^\s*引子.*/, /^\s*前言.*/, /^\s*写在[前后]面.*/, /^后记.*/],
sections = [],
buffer = '<article>',
title,
srcPath = process.argv[2],
bookName = path.basename(srcPath, '.txt'),
targetDir = path.join(path.dirname(srcPath), bookName);
var lineStream = fs.createReadStream(process.argv[2]).pipe(sl());
var indexTemplate = fs.readFileSync(path.join(__dirname, './template/index.html')).toString();
var contentTemplate = fs.readFileSync(path.join(__dirname, './template/content.html')).toString();

if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir);
}

var newSection = function(title, content) {
	sections.push(title);
	sectionHTML = contentTemplate.replace(/\*\*\*\*section\*\*\*\*/g, content);
	sectionHTML = sectionHTML.replace(/\*\*\*\*title\*\*\*\*/g, title);
	sectionHTML = sectionHTML.replace(/\*\*\*\*prev\*\*\*\*/g, (sections.length - 1) + '.html');
	sectionHTML = sectionHTML.replace(/\*\*\*\*next\*\*\*\*/g, (sections.length + 1) + '.html');
	if (sections.length > 1) {
		sectionHTML = sectionHTML.replace(/\*\*\*\*prev\*\*\*\*/g, (sections.length - 1) + '.html');
	}
	fs.writeFile(path.join(targetDir, sections.length + '.html'), sectionHTML);
};
var createIndexHtml = function() {
	var liBuffer = "";
	sections.forEach(function(sectionTitle, index) {
		liBuffer = liBuffer + '<li><a href="' + (index + 1) + '.html">' + sectionTitle + '</a></li>';
	});
	indexHtml = indexTemplate.replace(/\*\*\*\*title\*\*\*\*/g, bookName);
	indexHtml = indexHtml.replace(/\*\*\*\*index\*\*\*\*/g, liBuffer);
	fs.writeFile(path.join(targetDir, 'index.html'), indexHtml);
	fs.createReadStream(path.join(__dirname, './template/main.css')).pipe(fs.createWriteStream(path.join(targetDir, 'main.css')));
};

lineStream.on('data', function(line) {
	splitter.forEach(function(s) {
		if (line.length < 30 && (buffer === undefined || buffer.length > 100) && s.test(line)) {
			buffer = buffer + '</article>';
			if (undefined !== title) {
				newSection(title, buffer);
			}
			title = s.exec(line);
			console.log(title);
			buffer = '<article>\n';
			return;
		}
	});
	buffer = buffer + '<p>' + line + '</p>\n';
});
lineStream.on('end', function() {
	buffer = buffer + '</article>';
	newSection(title, buffer);
	createIndexHtml();
});
lineStream.on('error', function(e) {
	console.error('Error:' + e.getMessage());
});

