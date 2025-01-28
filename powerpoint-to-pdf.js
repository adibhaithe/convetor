document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const pptInput = document.getElementById('pptInput');
    const conversionOptions = document.getElementById('conversionOptions');
    const documentPreview = document.getElementById('documentPreview');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const conversionResult = document.getElementById('conversionResult');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFile = null;

    const handleFile = async (file) => {
        if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.type === 'application/vnd.ms-powerpoint') {
            try {
                selectedFile = file;
                
                // Show file info
                documentPreview.innerHTML = `
                    <div class="document-info">
                        <div class="file-details">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                    </div>
                    <div class="preview-content">
                        <p>PowerPoint preview is not available in the browser.</p>
                        <p>Your file has been loaded and is ready for conversion.</p>
                    </div>
                `;

                conversionOptions.style.display = 'block';
                convertBtn.disabled = false;
            } catch (error) {
                console.error('Error loading PowerPoint:', error);
                alert('Error loading PowerPoint file');
            }
        } else {
            alert('Please select a PowerPoint file (PPT or PPTX)');
        }
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => pptInput.click());
    
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

    pptInput.addEventListener('change', () => {
        if (pptInput.files.length > 0) {
            handleFile(pptInput.files[0]);
        }
    });

    // Convert button click handler
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        try {
            convertBtn.disabled = true;
            convertBtn.classList.add('loading');
            conversionStatus.textContent = 'Converting PowerPoint to PDF...';
            downloadSection.style.display = 'none';

            const quality = document.getElementById('pdfQuality').value;
            const includeNotes = document.getElementById('includeNotes').checked;
            const includeComments = document.getElementById('includeComments').checked;
            const includeHiddenSlides = document.getElementById('includeHiddenSlides').checked;

            // Create FormData to send to server
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('quality', quality);
            formData.append('includeNotes', includeNotes);
            formData.append('includeComments', includeComments);
            formData.append('includeHiddenSlides', includeHiddenSlides);

            // Send to server for conversion
            const response = await fetch('/api/convert/pptx-to-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Conversion failed on server');
            }

            // Get the converted PDF file
            const pdfBlob = await response.blob();
            const url = URL.createObjectURL(pdfBlob);

            // Show conversion results
            conversionResult.innerHTML = `
                <div class="conversion-info">
                    <h4>Conversion Complete!</h4>
                    <p>Your PDF is ready for download</p>
                    <div class="settings-summary">
                        <p>Quality: ${quality}</p>
                        <p>Included: ${[
                            includeNotes ? 'Speaker Notes' : '',
                            includeComments ? 'Comments' : '',
                            includeHiddenSlides ? 'Hidden Slides' : ''
                        ].filter(Boolean).join(', ') || 'Basic content only'}</p>
                    </div>
                </div>
            `;

            // Setup download button
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = selectedFile.name.replace(/\.(pptx?|ppt)$/i, '.pdf');
                link.click();
            };

            conversionStatus.textContent = 'Conversion successful!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Conversion failed. Please try again.';
            console.error('Error:', error);
            
            // Show more detailed error message to user
            alert('PowerPoint to PDF conversion failed. This might be because:\n' +
                  '1. The PowerPoint file is password protected\n' +
                  '2. The file is corrupted\n' +
                  '3. The file contains unsupported elements\n\n' +
                  'Please try again with a different file or contact support.');
        } finally {
            convertBtn.disabled = false;
            convertBtn.classList.remove('loading');
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