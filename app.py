import os
import webbrowser
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv
import threading
import time

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# 애플리케이션 포트 설정
PORT = 5000

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/translate", methods=["POST"])
def translate():
    data = request.json
    source_text = data.get("text", "")
    source_lang = data.get("sourceLang", "auto")
    target_lang = data.get("targetLang", "en")
    
    if not source_text:
        return jsonify({"error": "No text provided"}), 400
    
    # OpenRouter API를 통해 Gemini 2.0 Flash 모델 사용
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 번역 품질을 위한 최적화된 프롬프트
    system_prompt = f"""
    당신은 {source_lang}과 {target_lang} 언어에 정통한 전문 번역가입니다. 다음 가이드라인을 따라 번역해주세요:
    
    1. 원본 텍스트의 의미와 뉘앙스를 정확히 유지하세요
    2. 목표 언어의 자연스러운 표현과 문화적 맥락을 고려하세요
    3. 전문 용어나 관용구는 적절한 대응어를 사용하세요
    4. 원문의 스타일과 톤을 유지하세요
    5. 번역만 제공하고 추가 설명이나 주석은 달지 마세요
    """
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": f"다음 텍스트를 {target_lang}으로 번역해주세요:\n\n{source_text}"
            }
        ],
        "temperature": 0.3,
        "top_p": 0.95,
        "max_tokens": 4000 
    }
    
    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # API 응답에서 번역된 텍스트 추출
        translated_text = result["choices"][0]["message"]["content"]
        
        return jsonify({
            "translatedText": translated_text,
            "sourceLang": source_lang,
            "targetLang": target_lang
        })
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API 오류: {str(e)}"}), 500
    except (KeyError, IndexError) as e:
        return jsonify({"error": f"응답 처리 오류: {str(e)}"}), 500

@app.route("/enhance", methods=["POST"])
def enhance_translation():
    data = request.json
    translated_text = data.get("text", "")
    source_lang = data.get("sourceLang", "auto")
    target_lang = data.get("targetLang", "en")
    
    if not translated_text:
        return jsonify({"error": "No text provided"}), 400
    
    # OpenRouter API를 통해 Gemini 2.0 Flash 모델 사용
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 프롬프트 개선을 위한 시스템 프롬프트 (영어로 지시)
    system_prompt = """
    You are a world-class prompt engineering expert. Your goal is to analyze and optimize LLM instruction prompts to elicit more effective responses.

    Please follow these steps to improve the given prompt:

    Step 1: Enhance Clarity and Specificity
    - Clarify ambiguous instructions
    - Add step-by-step instructions where needed
    - Express goals and intentions more specifically

    Step 2: Add Context and Role
    - Assign appropriate roles or personas to the LLM (e.g., "You are an expert developer")
    - Add necessary background information or context
    - Provide guidance on the format or structure of the response

    Step 3: Add Examples and Constraints
    - Add examples where helpful (few-shot prompting)
    - Set appropriate constraints (length, format, style)
    - Add guardrails to prevent unwanted responses

    Step 4: Final Refinement
    - Optimize prompt order (place important instructions at the beginning or end)
    - Remove unnecessary content
    - Check overall flow and consistency

    Important:
    - Always maintain the core intent and purpose of the original prompt
    - Provide only the improved prompt without explanations of your modifications
    - ALWAYS respond in English, regardless of the input language
    - Apply prompt engineering best practices to make the LLM respond more effectively
    """
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": f"The following is a prompt intended to instruct an LLM. Please improve this prompt to make it more effective. Always respond in English.\n\n```\n{translated_text}\n```\n\nProvide only the improved prompt in English."
            }
        ],
        "temperature": 0.5,
        "top_p": 0.92,
        "max_tokens": 4000 
    }
    
    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        
        # API 응답에서 개선된 프롬프트 추출
        enhanced_prompt = result["choices"][0]["message"]["content"]
        
        return jsonify({
            "enhancedText": enhanced_prompt,
            "sourceLang": source_lang,
            "targetLang": target_lang
        })
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API 오류: {str(e)}"}), 500
    except (KeyError, IndexError) as e:
        return jsonify({"error": f"응답 처리 오류: {str(e)}"}), 500

# 브라우저 열기 함수
def open_browser():
    """애플리케이션이 실행된 후 브라우저를 자동으로 열어주는 함수"""
    time.sleep(1)  # 서버가 완전히 시작될 때까지 잠시 대기
    webbrowser.open_new(f"http://localhost:{PORT}")

if __name__ == "__main__":
    # 브라우저를 열기 위한 쓰레드 시작
    threading.Thread(target=open_browser).start()
    
    # 애플리케이션 실행
    print(f"* 서버가 http://localhost:{PORT}에서 실행 중입니다")
    app.run(debug=True, port=PORT) 