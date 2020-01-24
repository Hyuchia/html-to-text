import htmlToText from '../../dist/html-to-text.min.js';

describe('Compund elements are transformed correctly', function() {
  it('Converts links', function() {
    expect(htmlToText('<span class="mention" data-index="0" data-denotation-char="" data-id="1" data-value="">﻿<span contenteditable="false"><span class="ql-mention-denotation-char"></span><a href="http://localhost:8001/#/u/business">@business</a></span>﻿</span>')).to.equal('@business (http://localhost:8001/#/u/business)');
  });
});
