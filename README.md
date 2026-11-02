# Function Studio

This is a static website. No build command or backend is needed.

## GitHub Pages upload

Upload ALL of the extracted website, including the entire `vendor` folder. Uploading only the loose HTML, JavaScript, and CSS files will leave presets working but break all custom math fields.

The repository root must include:

    index.html
    style.css
    math-input.js
    app.js
    combination-plane.js
    transforms.js
    composition.js
    navigation.js
    .nojekyll
    vendor/
        mathlive.js
        compute-engine.js
        fonts/
            (all supplied .woff2 files)
        MATHLIVE-LICENSE.txt
        COMPUTE-ENGINE-LICENSE.txt

On GitHub, select Add file > Upload files and drag the extracted `vendor` FOLDER onto the upload area. Preserve its name and nested `fonts` folder. Commit the upload, wait for Pages to deploy, and reload the website.

Check that `vendor/mathlive.js` and `vendor/compute-engine.js` open beneath the published site's URL instead of returning 404. Their paths are relative, so project URLs such as `/Function-Combinations/` work.

The supplied `.nojekyll` marker tells GitHub Pages to publish the files as a plain static website.

Math libraries are bundled locally. No API keys or paid services are used. Their licenses are included under `vendor`.


## Open a downloaded copy
Extract the complete ZIP, keep the files and vendor folder together, and open index.html in a browser. No installation, server, or account is required. Sweep starts the pairs rapidly while each animation runs at the selected normal playback speed. In Full plane, changing the horizontal range or window width rebuilds the sample grid and clears the previous result.

