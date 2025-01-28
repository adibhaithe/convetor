document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const wordInput = document.getElementById('wordInput');
    const conversionOptions = document.getElementById('conversionOptions');
    const documentPreview = document.getElementById('documentPreview');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');

    let documentContent = null;

    const handleFile = async (file) => {
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'application/msword') {
            try {
                // Show file info
                documentPreview.innerHTML = `
                    <div class="document-info">
                        <div class="file-details">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                    </div>
                    <div class="preview-content"></div>
                `;

                const previewContent = documentPreview.querySelector('.preview-content');
                
                // Convert DOCX to HTML for preview
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                documentContent = result.value;
                previewContent.innerHTML = documentContent;

                conversionOptions.style.display = 'block';
                convertBtn.disabled = false;
            } catch (error) {
                console.error('Error loading document:', error);
                alert('Error loading document file');
            }
        } else {
            alert('Please select a Word document (DOC or DOCX file)');
        }
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => wordInput.click());
    
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

    wordInput.addEventListener('change', () => {
        if (wordInput.files.length > 0) {
            handleFile(wordInput.files[0]);
        }
    });

    // Convert button click handler
    convertBtn.addEventListener('click', async () => {
        if (!documentContent) return;

        try {
            convertBtn.disabled = true;
            convertBtn.classList.add('loading');
            conversionStatus.textContent = 'Converting document to PDF...';
            downloadSection.style.display = 'none';

            const pageSize = document.getElementById('pageSize').value;
            const margins = document.getElementById('margins').value;

            // Create PDF
            const marginSizes = {
                normal: 25.4, // 1 inch in mm
                narrow: 12.7, // 0.5 inch in mm
                wide: 31.8   // 1.25 inch in mm
            };

            const doc = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: pageSize
            });

            // Add content to PDF
            const margin = marginSizes[margins];
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - (2 * margin);

            // Create temporary element to measure content
            const temp = document.createElement('div');
            temp.innerHTML = documentContent;
            temp.style.width = `${contentWidth}mm`;
            document.body.appendChild(temp);

            // Split content into pages
            const contentHeight = temp.offsetHeight;
            const maxContentHeight = pageHeight - (2 * margin);
            document.body.removeChild(temp);

            // Add content to PDF
            doc.html(temp, {
                callback: function(pdf) {
                    const pdfBlob = pdf.output('blob');
                    const url = URL.createObjectURL(pdfBlob);

                    // Setup download button
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'converted.pdf';
                        link.click();
                    };

                    conversionStatus.textContent = 'Conversion successful!';
                    downloadSection.style.display = 'block';
                },
                x: margin,
                y: margin,
                width: contentWidth,
                windowWidth: contentWidth * 3.779527559 // Convert mm to px
            });

        } catch (error) {
            conversionStatus.textContent = 'Conversion failed. Please try again.';
            console.error('Error:', error);
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