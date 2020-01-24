import htmlToText from '../../dist/html-to-text.min.js';

describe('Single elements are transformed correctly', function() {
  it('Converts links', function() {
    const link = htmlToText('<a href="https://blac-sheep.com">Blac Sheep</a>');
    expect(link).to.equal('Blac Sheep (https://blac-sheep.com)');

    expect(htmlToText('<a href="https://blac-sheep.com"></a>')).to.equal('');
  });

  it('Converts Text Styling Elements', function() {
    expect(htmlToText('<b>Bold</b>')).to.equal('Bold');
    expect(htmlToText('<i>Italic</i>')).to.equal('Italic');
    expect(htmlToText('<sub>Subscript</sub>')).to.equal('Subscript');
    expect(htmlToText('<sup>Superscript</sup>')).to.equal('Superscript');
    expect(htmlToText('<sup>Superscript</sup>')).to.equal('Superscript');
  });

  it('Converts Paragraphs to Line Breaks', function() {
    expect(htmlToText('<p>This is a paragraph</p><p>This is another paragraph</p>')).to.equal('This is a paragraph\nThis is another paragraph');
  });

  it('Converts Divs Line Breaks', function() {
    expect(htmlToText('<div>This is a div</div><div>This is another div</div>')).to.equal('This is a div\nThis is another div');
  });

  it('Removes Unparsable Elements', function() {
    expect(htmlToText('<audio src="someSource"/>')).to.equal('');
    expect(htmlToText('<audio src="someSource"></audio>')).to.equal('');
    expect(htmlToText('<audio src="someSource"><track><track></audio>')).to.equal('');
  });

  it('Converts Images', function() {
    expect(htmlToText('<img src="someSource" alt="Image Alt Text">')).to.equal('Image: Image Alt Text (someSource)');
    expect(htmlToText('<img alt="Image Alt Text" src="someSource">')).to.equal('Image: Image Alt Text (someSource)');
    expect(htmlToText('<img src="someSource">')).to.equal('Image: someSource');
  });

  it('Converts Lists', function() {
    expect(htmlToText('<ul><li>One</li><li>Two</li><li>Three</li></ul>')).to.equal('* One\n* Two\n* Three');
    expect(htmlToText('<ol><li>One</li><li>Two</li><li>Three</li></ol>')).to.equal('* One\n* Two\n* Three');
  });
});
