# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

### backend
cd backend
./venv/Scripts/Activate
uvicorn main:app --reload
uvicorn main:app --host 0.0.0.0 --port 8000

### frontend
npm start

## Render OCR / evaluation reliability

The OCR and evaluation endpoints run as synchronous FastAPI handlers, so their
blocking PDF conversion, NVIDIA calls, and model inference execute in worker
threads instead of blocking the API event loop. The existing frontend request
and response formats are unchanged.

### Recommended Render configuration

- Run from the backend directory with start command
	`uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1`.
	`$PORT` here is Render's Linux environment variable, not PowerShell syntax.
- Configure `/health` as the health-check path.
- Ensure Poppler's `pdfinfo` and `pdftoppm` executables are installed in the
	deployment image (Debian/Ubuntu package: `poppler-utils`). Installing the
	Python package `pdf2image` alone does not install these binaries.
- Set `NVIDIA_API_KEY` in Render's environment settings. Check that your key
	has access to the configured vision model and sufficient NVIDIA quota.
- Set `REACT_APP_API_URL` in Vercel to the HTTPS Render backend URL and redeploy
	the frontend; Create React App embeds this value at build time.

| Backend environment variable | Default | Purpose |
| --- | --- | --- |
| `PROCESSING_MAX_JOBS` | `1` | Maximum active OCR/evaluation requests per process, shared by single and batch routes |
| `OCR_MAX_WORKERS` | `1` | Maximum rendered pages / concurrent NVIDIA page requests in a batch |
| `OCR_DPI` | `120` | PDF rendering resolution; increase if handwriting accuracy needs it |
| `OCR_TIMEOUT` | `90` | NVIDIA response read timeout in seconds, per attempt |
| `NVIDIA_OCR_MODEL` | `meta/llama-3.2-11b-vision-instruct` | Vision model ID supporting NVIDIA's chat-completions image format |
| `POPPLER_PATH` | Windows development fallback; system PATH on Linux | Optional directory containing Poppler binaries |
| `CORS_ORIGINS` | Local development URLs and `https://ai-based-answersheet-eval.vercel.app` | Comma-separated frontend origins; add custom domains or preview origins explicitly |

Use conservative concurrency until you have measured peak memory. The semantic
model is reused once per process, but PyTorch plus the model may still exceed
small instance memory limits. Increasing the number of server workers duplicates
model memory and the per-process admission limit.

### Failure behavior

- An extra OCR/evaluation request gets HTTP **503** and `Retry-After: 10`
	while the processing slot is occupied. This is admission control, not a job
	queue. The frontend displays the server's error message; retry manually after
	the active job completes. Upload POST requests are not automatically retried.
- PDF images are rendered in bounded batches and closed before the next batch.
- NVIDIA timeouts, connection failures, rate limits, and selected transient
	server failures are retried at most three times. `Retry-After` seconds and
	HTTP dates are honored up to 120 seconds. Invalid keys/models fail immediately.
- Failed OCR pages abort the request rather than silently grading partial text.
	A blank/unreadable scanned page may therefore require cleaning the PDF first.
- Render logs include NVIDIA HTTP status, page number, and attempt number, but
	not API keys, image payloads, or upstream response bodies.

These changes do not make processing durable or eliminate HTTP gateway timeouts.
For large batches, use a persistent job queue and separate worker, return a job
ID on upload, and poll for progress/results. Store uploads/results in persistent
object storage; Render's local filesystem can be lost on restart or redeploy.
Render Free services also spin down after inactivity; a paid service removes
that cold-start limitation, but does not fix NVIDIA quota or code errors.

### Regression tests

From the backend directory, install the development requirements with
`python -m pip install -r requirements-dev.txt`, then run
`python -m unittest discover -s tests -v` in your selected Python environment.
Tests mock NVIDIA and model loading, do not connect to MongoDB, and cover
event-loop responsiveness, overload rejection, slot release, model reuse,
page ordering/cleanup, and retry behavior.

### Credential security

Rotate any credentials previously committed to source control, including NVIDIA,
MongoDB, SMTP, JWT signing, and payment credentials. Set replacements as Render
environment variables, remove hardcoded secrets, and never commit live keys.
