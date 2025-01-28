document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const compressionOptions = document.getElementById('compressionOptions');
    const pdfInfo = document.getElementById('pdfInfo');
    const compressBtn = document.getElementById('compressBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const compressionResult = document.getElementById('compressionResult');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFile = null;
    let originalSize = 0;

    const handleFile = async (file) => {
        if (file.type === 'application/pdf') {
            selectedFile = file;
            originalSize = file.size;
            compressionOptions.style.display = 'block';
            
            try {
                // Load PDF and show info
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdf.getPageCount();

                pdfInfo.innerHTML = `
                    <h4>${file.name}</h4>
                    <p>Pages: ${pageCount}</p>
                    <p>Size: ${formatFileSize(file.size)}</p>
                `;

                compressBtn.disabled = false;
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

    // Compress button click handler
    compressBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        try {
            compressBtn.disabled = true;
            compressBtn.classList.add('loading');
            conversionStatus.textContent = 'Compressing PDF...';
            downloadSection.style.display = 'none';

            const compressionLevel = document.querySelector('input[name="compressionLevel"]:checked').value;
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);

            // Apply compression based on selected level
            const compressionSettings = {
                recommended: { quality: 0.8, resolution: 150 },
                high: { quality: 0.6, resolution: 100 },
                low: { quality: 0.9, resolution: 200 }
            }[compressionLevel];

            // Compress each page
            const pages = pdf.getPages();
            for (const page of pages) {
                // Implement compression logic here
                // This is a simplified version
                await page.scale(0.9, 0.9);
            }

            const compressedBytes = await pdf.save();
            const blob = new Blob([compressedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Show compression results
            const newSize = blob.size;
            const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

            compressionResult.innerHTML = `
                <h4>Compression Complete!</h4>
                <div class="size-comparison">
                    <div class="size-item">
                        <span class="size-label">Original size</span>
                        <span class="size-value">${formatFileSize(originalSize)}</span>
                    </div>
                    <div class="size-item">
                        <span class="size-label">New size</span>
                        <span class="size-value">${formatFileSize(newSize)}</span>
                    </div>
                    <div class="size-item">
                        <span class="size-label">Reduction</span>
                        <span class="size-value reduction">${reduction}%</span>
                    </div>
                </div>
            `;

            // Setup download button
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `compressed_${selectedFile.name}`;
                link.click();
            };

            conversionStatus.textContent = 'Compression successful!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Compression failed. Please try again.';
            console.error('Error:', error);
        } finally {
            compressBtn.disabled = false;
            compressBtn.classList.remove('loading');
        }
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 