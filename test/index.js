const htmlToText = require('./../dist/html-to-text').default;

console.log(htmlToText ('<p>This is a<strong> test event </strong>witsh <em>rich text</em> settings.</p><p><br></p><p class="ql-align-right">Some alignment.</p><p><br></p><p class="ql-align-center">Is due</p><p class="ql-align-center"><br></p><ol><li>One</li><li>Two</li><li>Thre</li></ol><p><br></p><p>Other:</p><ul><li>One</li><li>Two</li><li>Three</li></ul><p><br></p><p><img src="http://localhost:8000/media/users/1/temp_lg_PvGdrcs.png"></p>'));
