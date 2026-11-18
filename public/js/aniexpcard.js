// 函数：处理卡片操作
function handleCardAction() {
    // 步骤1: 从当前URL提取cardid参数
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('cardid');
    if (!cardId) {
        alert('仅可通过无料才可以获取返图哦');
        return;
    }

    // 步骤2: GET请求API
    const apiUrl = `https://cardapi.shigu.cc/cardid/${cardId}`;
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            // 对于404状态码，继续解析JSON以获取详细信息
            if (!response.ok && response.status !== 404) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let {status, data: redirectUrl, msg} = data;

            // 当status为404时，覆盖msg字段，并调整模态框参数
            if (status === 404) {
                msg = '该卡片可能不存在，请通过页内联系我';
                redirectUrl = null;
            }

            // 步骤3: 根据状态创建并显示弹窗
            const modalStatus = status === 404 ? 'error' : status;
            createFuwariModal(modalStatus, redirectUrl, msg);
        })
        .catch(error => {
            console.error('获取失败:', error);
            alert('暂时无法获取，请稍后重试。');
        });
}

// 辅助函数：创建Fuwari风格弹窗
function createFuwariModal(status, redirectUrl, msg) {
    // 移除现有弹窗（如果有）
    const existingModal = document.querySelector('.fuwari-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建弹窗HTML结构
    const modalHtml = `
        <div class="fuwari-modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5);">
            <div class="pb-4 card-base onload-animation" style="background-color: rgb(  82, 58, 71 ); margin: 15% auto; padding: 2rem; border-radius: 0.75rem; width: 80%; max-width: 500px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                <div class="prose dark:prose-invert prose-base !max-w-none custom-md mt-2" data-pagefind-body="">
                    <p class="overflow-hidden text-left whitespace-nowrap overflow-ellipsis" style="color: var(--fuwari-text); margin-bottom: 1.5rem;">${msg || '疑似忘记说了QwQ'}</p>
                    <div class="fuwari-modal-actions" style="display: flex; justify-content: flex-end; gap: 1rem;">
                        <button id="modal-cancel" class="btn-regular h-8 text-sm px-3 rounded-lg" style="background-color: rgb( 67, 46, 57 ); color: var(--fuwari-text-inverse); border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
                            关闭
                        </button>
                        ${redirectUrl ? `<button id="modal-confirm" class="btn-regular h-8 text-sm px-3 rounded-lg" style="background-color: rgb( 67, 46, 57 ); color: var(--fuwari-text-inverse); border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
                            确定
                        </button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // 注入到body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 显示弹窗
    const modal = document.querySelector('.fuwari-modal');
    modal.style.display = 'block';
    modal.classList.add('fuwari-show'); // 假设Fuwari使用此类添加动画

    // 绑定事件
    const cancelBtn = document.getElementById('modal-cancel');
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    if (redirectUrl) {
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.addEventListener('click', () => {
            window.location.href = redirectUrl;
        });
    }

    // 点击遮罩关闭（可选Fuwari行为）
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}