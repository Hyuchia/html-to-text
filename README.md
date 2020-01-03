# HTML To Text

This library is based on: [Luke Scott's html-to-formatted-text](https://github.com/lukeaus/html-to-formatted-text)

A simple utility to convert HTML to nicely printed text, while trying to keep as much elements as possible.

### Installation
This library is provided as an UMD module that can be installed by adding the files manually to your project or via a package manager.

**Yarn**
```
yarn add @blac-sheep/html-to-text
```

**NPM**
```
npm install @blac-sheep/html-to-text
```

**Adding it manually**
```html
<script src="html-to-text.min.js"></script>
```

### Usage

**NodeJS**
```javascript
const htmlToText = require('@blac-sheep/html-to-text').default;
```

**ES6**
```javascript
import htmlToText from '@blac-sheep/html-to-text';
```

**Browser**
```javascript
const htmlToText = HTMLToText.default;
```

### Examples

```javascript

htmlToText('<a href="https://blac-sheep.com">Blac Sheep</a>'); // Blac Sheep (https://blac-sheep.com)

htmlToText('<ul><li>One</li><li>Two</li><li>Three</li></ul>'); // * One\n* Two\n* Three

htmlToText('<img src="https://example.com/someImage.png" alt="Image Alt Text">'); // Image: Image Alt Text (https://example.com/someImage.png)

htmlToText('<p>This is a paragraph</p><p>This is another paragraph</p>'); // This is a paragraph\nThis is another paragraph
```

## License
This library is released under the [MIT license](LICENSE.md).