// PDF Converter Module
// Handles all PDF generation functionality

async function generatePDF() {
    const preview = document.getElementById('pdfPreview');
    preview.innerHTML = createPDFContent();
    preview.style.display = 'block';
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pages = preview.querySelectorAll('.pdf-page');
    
    for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
            doc.addPage();
        }
        
        const canvas = await html2canvas(pages[i], {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    doc.save((document.getElementById('testTitle').value || 'test') + '.pdf');
    preview.style.display = 'none';
}

function createPDFContent() {
    const title = document.getElementById('testTitle').value || 'Test';
    const instructions = document.getElementById('instructions').value;
    const questions = document.querySelectorAll('.question-block');
    
    let html = '<div class="pdf-page">';
    
    // Header section
    html += '<div class="pdf-header">';
    html += `<div class="pdf-title">${title}</div>`;
    html += '<div class="pdf-subtitle">Multiple Choice Test</div>';
    html += '</div>';
    
    // Instructions section
    if (instructions) {
        html += `<div class="pdf-instructions"><strong>Instructions:</strong> ${instructions}</div>`;
    }
    
    let questionHeight = 0;
    const maxHeight = 255; // Increased to account for reduced CSS margins
    let pageNumber = 1;
    
    questions.forEach((questionBlock, index) => {
        const type = questionBlock.querySelector('.question-type')?.value || "multiple";
        const questionText = questionBlock.querySelector('.question-text')?.value || 'Question ' + (index + 1);
        
        // Estimate height (more accurate calculation)
        let estimatedHeight = 30; // Reduced base height
        
        if (type === "multiple") {
            const answers = questionBlock.querySelectorAll('.answer-option input');
            estimatedHeight += (answers.length * 10); // Further reduced per-answer height
        } else if (type === "typing") {
            estimatedHeight += 18; // Reduced from 20
        } else if (type === "fill") {
            estimatedHeight += 15; // Reduced from 18
        } else if (type === "matching") {
            const rows = questionBlock.querySelectorAll('.matching-row');
            estimatedHeight += (rows.length * 12); // Reduced from 15
        }
        
        // Check if we need a new page
        if (questionHeight + estimatedHeight > maxHeight && index > 0) {
            html += '<div class="pdf-footer">';
            html += `<div class="pdf-page-number">Page ${pageNumber}</div>`;
            html += '</div>';
            html += '</div><div class="pdf-page">';
            
            // Add header to new page
            html += '<div class="pdf-header">';
            html += `<div class="pdf-title">${title}</div>`;
            html += '<div class="pdf-subtitle">(continued)</div>';
            html += '</div>';
            
            questionHeight = 0;
            pageNumber++;
        }
        
        html += '<div class="pdf-question">';
        html += '<div class="pdf-question-text">';
        html += `<span class="pdf-question-number">${index + 1}</span>`;
        html += `<span>${questionText}</span>`;
        html += '</div>';
        
        if (type === "multiple") {
            const answers = questionBlock.querySelectorAll('.answer-option input');
            const answerArray = Array.from(answers).map(a => a.value || `Answer ${Array.from(answers).indexOf(a) + 1}`);
            
            html += '<div class="pdf-answers">';
            answerArray.forEach((answer, i) => {
                html += `
                    <div class="pdf-answer">
                        <div class="pdf-checkbox"></div>
                        <span>${String.fromCharCode(65 + i)}. ${answer}</span>
                    </div>
                `;
            });
            html += '</div>';
        } else if (type === "typing") {
            const answer = questionBlock.querySelector('.typing-answer')?.value || "";
            html += '<div class="pdf-typing-answer">';
            html += `<span style="color: #666; font-size: 12px;">Expected Answer:</span> ${answer}`;
            html += '</div>';
            html += '<div class="pdf-typing-line"></div>';
        } else if (type === "fill") {
            const sentence = questionBlock.querySelector('.fill-sentence')?.value || "";
            const hiddenWord = questionBlock.querySelector('.fill-answer')?.value || "";
            
            let outputSentence = sentence;
            if (hiddenWord) {
                const blanks = `<span class="pdf-fill-blank">${"_".repeat(Math.max(hiddenWord.length, 8))}</span>`;
                outputSentence = sentence.replace(hiddenWord, blanks);
            }
            
            html += `<div class="pdf-fill">${outputSentence}</div>`;
        } else if (type === "matching") {
            const rows = questionBlock.querySelectorAll('.matching-row');
            const leftItems = [];
            const rightItems = [];
            
            rows.forEach(row => {
                const left = row.querySelector('.left-item')?.value;
                const right = row.querySelector('.right-item')?.value;
                
                if (left && right) {
                    leftItems.push(left);
                    rightItems.push(right);
                }
            });
            
            // Shuffle right side only
            const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);
            
            html += '<div class="pdf-matching">';
            html += '<div class="pdf-matching-left">';
            leftItems.forEach((text, i) => {
                html += `<div>${String.fromCharCode(65 + i)}. ${text}</div>`;
            });
            html += '</div>';
            
            html += '<div class="pdf-matching-right">';
            shuffledRight.forEach((text, i) => {
                html += `<div>${i + 1}. ${text}</div>`;
            });
            html += '</div>';
            html += '</div>';
        }
        
        html += '</div>';
        questionHeight += estimatedHeight;
    });
    
    // Add footer to last page
    html += '<div class="pdf-footer">';
    html += `<div class="pdf-page-number">Page ${pageNumber}</div>`;
    html += '</div>';
    
    html += '</div>';
    return html;
}
