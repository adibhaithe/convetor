document.addEventListener('DOMContentLoaded', () => {
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const conversionOptions = document.getElementById('conversionOptions');
    const pdfPreview = document.getElementById('pdfPreview');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const imagePreview = document.getElementById('imagePreview');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const pageRange = document.getElementById('pageRange');

    let pdfDocument = null;
    let totalPages = 0;

    // Handle page selection radio buttons
    document.querySelectorAll('input[name="pageSelection"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            pageRange.disabled = e.target.value === 'all';
        });
    });

    const handleFile = async (file) => {
        if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer();
                pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                totalPages = pdfDocument.numPages;

                // Show preview of first page
                const page = await pdfDocument.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                pdfPreview.innerHTML = `
                    <div class="pdf-info">
                        <h4>${file.name}</h4>
                        <p>Total pages: ${totalPages}</p>
                    </div>
                    <img src="${canvas.toDataURL()}" alt="First page preview">
                `;

                conversionOptions.style.display = 'block';
                convertBtn.disabled = false;
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Error loading PDF file');
            }
        } else {
            alert('Please select a PDF file');
        }
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => pdfInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e74c3c';
        uploadArea.style.background = '#fff9f9';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = 'white';
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    pdfInput.addEventListener('change', () => {
        if (pdfInput.files.length > 0) {
            handleFile(pdfInput.files[0]);
        }
    });

    // Convert button click handler
    convertBtn.addEventListener('click', async () => {
        if (!pdfDocument) return;

        try {
            convertBtn.disabled = true;
            convertBtn.classList.add('loading');
            conversionStatus.textContent = 'Converting PDF to images...';
            imagePreview.innerHTML = '';
            downloadSection.style.display = 'none';

            const quality = document.getElementById('imageQuality').value;
            const scale = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1;
            
            let pagesToConvert = [];
            const pageSelection = document.querySelector('input[name="pageSelection"]:checked').value;
            
            if (pageSelection === 'all') {
                pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
            } else {
                // Parse page range
                pagesToConvert = pageRange.value.split(',')
                    .map(range => range.trim())
                    .flatMap(range => {
                        const [start, end] = range.split('-').map(num => parseInt(num));
                        return end 
                            ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
                            : [start];
                    });
            }

            const convertedImages = [];

            for (const pageNum of pagesToConvert) {
                const page = await pdfDocument.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
                convertedImages.push({ pageNum, url: imageUrl });

                // Add preview
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${imageUrl}" alt="Page ${pageNum}">
                    <span class="page-number">Page ${pageNum}</span>
                    <button class="download-single" data-page="${pageNum}">
                        ⬇️
                    </button>
                `;
                imagePreview.appendChild(previewItem);

                // Add single image download
                previewItem.querySelector('.download-single').onclick = () => {
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = `page-${pageNum}.jpg`;
                    link.click();
                };
            }

            // Setup download all button
            downloadAllBtn.onclick = () => {
                convertedImages.forEach(({ pageNum, url }) => {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `page-${pageNum}.jpg`;
                    link.click();
                });
            };

            conversionStatus.textContent = 'Conversion successful!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Conversion failed. Please try again.';
            console.error('Error:', error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.classList.remove('loading');
        }
    });
}); 