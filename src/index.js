import striptags from 'striptags';
import { compose } from './utils';
import entities from './entities';

const blocks = [
  'p',
  'div',
  'br',
  'hr',
  'title',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ol',
  'ul',
  'li',
  'pre',
  'table',
  'th',
  'td',
  'blockquote',
  'header',
  'footer',
  'nav',
  'section',
  'summary',
  'aside',
  'article',
  'address',
  'code',
  'img',
];

const unparsable = [
  'audio',
  'iframe',
  'map',
  'progress',
  'track',
  'meter',
  'object',
  'svg',
  'wbr',
  'video',
  'webview',
  'dialog',
  'canvas',
];

const preprocess = html => {
  return html;
};

const removeTextStyling = html => html.replace(/<(\/)?(b|i|strong|em|font|sup|sub|small|del)>/g, '');

const removeUnparsableElements = html => {
  for (const element of unparsable) {
    html = html.replace(new RegExp(`<${element}(.+?)?>(.+?)?<\/${element}>`, 'g'), '');
    html = html.replace(new RegExp(`<${element}(.+?)?\/>`, 'g'), '');
    html = html.replace(new RegExp(`<${element}(.+?)>`, 'g'), '');
  }
  return html;
};

// Remove all the elements that don't really matter
const removeSilentElements = html => html.replace(/<(\/)?(ul|ol|span)+(.*?)>/g, '');

const parseLinks = html => {
  // First parse all links that have some text
  html = html.replace(/<a(.+?)href="(.+?)"(.+?)?>(.+?)<\/a>/g, '$4 ($2)');

  // Remove all those that doesn't
  return html.replace(/<a(.+?)href="(.+?)"(.+?)?>(.*?)<\/a>/g, '');
};

const parseImages = html => {
  // Parse images where the alt property is before the src one
  html = html.replace(/<img(.+?)alt="(.+?)"(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2 ($4)');

  // Parse images where the alt property is after the src one
  html = html.replace(/<img(.+?)src="(.+?)"(.+?)alt="(.+?)"(.*?)>/gm, 'Image: $4 ($2)');

  // Parse images where no alt property was provided
  html = html.replace(/<img(.+?)src="(.+?)"(.*?)>/gm, 'Image: $2');

  return html;
};

const breakOnBlocks = html => {
  for (const block of blocks) {
    html = html.replace(new RegExp(`<\/${block}>`, 'gm'), `</${block}>\n`);
  }
  return html;
};

const removeExtraBreakLines = html => html.replace(/(\n\n)+/gm, '\n');

const removeBlocks = html => {
  for (const block of blocks) {
    html = html.replace(new RegExp(`<${block}(.*?)>`, 'gm'), '');
    html = html.replace(new RegExp(`<\/${block}(.*?)>`, 'gm'), '');
  }
  return html;
};

const parseListItems = html => {
  // Parse list items that are not empty first
  html = html.replace(/<li(.*?)>(.+?)<\/li>/gm, '* $2\n');

  // Remove the empty ones
  return html.replace(/<li(.*?)>(.*?)<\/li>/gm, '');
};

const replaceEntities = html => {
  for (const entity in entities) {
    html = html.replace(new RegExp(`${entity}`, 'gm'), entities[entity]);
  }
  return html;
};

const replaceSensitiveCharacters = html => {
  html = html.replace(/&gt;/gm, '>');
  html = html.replace(/&GT;/gm, '>');

  html = html.replace(/&lt;/gm, '<');
  html = html.replace(/&LT;/gm, '<');

  html = html.replace(/&quot;/gm, '"');
  html = html.replace(/&QUOT;/gm, '"');

  html = html.replace(/﻿/gm, '');

  return html;
};

const removeLeadingNewLines = html => html.replace(/\n+$/, '');

const removeTrailingNewLines = html => html.replace(/^\n+/, '');

const removeAllNonTagsToBreakOn = html => striptags(html, blocks);
const convertTagsToBreak = html => striptags(html, [], '\n');

const removeIndentation = html => html.replace(/(^\t+)/gm, '');

const htmlToText = compose(
  removeIndentation,
  replaceSensitiveCharacters,

  convertTagsToBreak,
  removeAllNonTagsToBreakOn,

  //removeExtraBreakLines,
  removeLeadingNewLines,
  removeTrailingNewLines,

  removeBlocks,
  breakOnBlocks,

  parseImages,
  parseListItems,
  parseLinks,

  replaceEntities,
  removeTextStyling,
  removeSilentElements,
  removeUnparsableElements,

  preprocess,
);

export default htmlToText;
