document.addEventListener('DOMContentLoaded', () => {
    // 요소 선택
    const sourceText = document.getElementById('sourceText');
    const targetText = document.getElementById('targetText');
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const swapBtn = document.getElementById('swapBtn');
    const enhanceBtn = document.getElementById('enhanceBtn');
    const loading = document.getElementById('loading');
    const enhancing = document.getElementById('enhancing');
    const errorMsg = document.getElementById('errorMsg');

    // 번역 함수
    async function translateText() {
        const text = sourceText.value.trim();
        
        if (!text) {
            showError('번역할 텍스트를 입력해주세요.');
            return;
        }
        
        showLoading(true);
        hideError();
        
        try {
            const response = await fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: sourceLang.value,
                    targetLang: targetLang.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                targetText.value = data.translatedText;
                // 번역 결과가 있으면 강화 버튼 활성화
                enhanceBtn.disabled = false;
            } else {
                showError(data.error || '번역 중 오류가 발생했습니다.');
            }
        } catch (error) {
            showError('서버 연결 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Translation error:', error);
        } finally {
            showLoading(false);
        }
    }

    // 프롬프트 강화 함수
    async function enhanceTranslation() {
        const text = targetText.value.trim();
        
        if (!text) {
            showError('변형할 프롬프트가 없습니다.');
            return;
        }
        
        showEnhancing(true);
        hideError();
        
        try {
            const response = await fetch('/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: sourceLang.value,
                    targetLang: targetLang.value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                targetText.value = data.enhancedText;
                // 강화 완료 알림
                showEnhanceSuccess();
            } else {
                showError(data.error || '프롬프트 변형 중 오류가 발생했습니다.');
            }
        } catch (error) {
            showError('서버 연결 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('Enhancement error:', error);
        } finally {
            showEnhancing(false);
        }
    }

    // 로딩 표시
    function showLoading(show) {
        if (show) {
            loading.classList.remove('d-none');
            translateBtn.disabled = true;
            enhanceBtn.disabled = true;
        } else {
            loading.classList.add('d-none');
            translateBtn.disabled = false;
            // 번역 결과가 있을 때만 강화 버튼 활성화
            enhanceBtn.disabled = !targetText.value.trim();
        }
    }

    // 강화 로딩 표시
    function showEnhancing(show) {
        if (show) {
            enhancing.classList.remove('d-none');
            translateBtn.disabled = true;
            enhanceBtn.disabled = true;
        } else {
            enhancing.classList.add('d-none');
            translateBtn.disabled = false;
            enhanceBtn.disabled = false;
        }
    }

    // 강화 성공 표시
    function showEnhanceSuccess() {
        const originalClass = enhanceBtn.className;
        const originalHTML = enhanceBtn.innerHTML;
        
        enhanceBtn.className = 'btn btn-outline-success';
        enhanceBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg> 변형 완료';
        
        setTimeout(() => {
            enhanceBtn.className = originalClass;
            enhanceBtn.innerHTML = originalHTML;
        }, 2000);
    }

    // 오류 메시지 표시
    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('d-none');
    }

    // 오류 메시지 숨기기
    function hideError() {
        errorMsg.classList.add('d-none');
    }

    // 텍스트 복사 함수
    function copyToClipboard() {
        if (!targetText.value) {
            return;
        }
        
        targetText.select();
        document.execCommand('copy');
        
        // 복사 버튼 상태 변경
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '복사됨!';
        copyBtn.classList.remove('btn-outline-primary');
        copyBtn.classList.add('btn-success');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('btn-success');
            copyBtn.classList.add('btn-outline-primary');
        }, 1500);
    }

    // 언어 스왑 함수
    function swapLanguages() {
        // 자동 감지일 경우 스왑 불가
        if (sourceLang.value === 'auto') {
            showError('자동 감지 모드에서는 언어를 스왑할 수 없습니다.');
            return;
        }
        
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;
        
        // 텍스트도 스왑
        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = tempText;

        // 번역 결과가 있을 때만 강화 버튼 활성화
        enhanceBtn.disabled = !targetText.value.trim();
    }

    // 초기화 함수
    function clearAll() {
        sourceText.value = '';
        targetText.value = '';
        hideError();
        enhanceBtn.disabled = true;
    }

    // 이벤트 리스너
    translateBtn.addEventListener('click', translateText);
    enhanceBtn.addEventListener('click', enhanceTranslation);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyToClipboard);
    swapBtn.addEventListener('click', swapLanguages);
    
    // 엔터 키로 번역
    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            translateText();
        }
    });

    // 초기 상태에서 강화 버튼 비활성화
    enhanceBtn.disabled = true;
}); 