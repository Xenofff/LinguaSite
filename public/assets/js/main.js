        // Инициализация векторных иконок Lucide
        lucide.createIcons();

        // Header scroll effect
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 20);
        });

        // Modal 1: Логика для оферты
        const modalOverlay = document.getElementById('modalOverlay');
        const ofertaBtn = document.getElementById('ofertaBtn');
        const modalClose = document.getElementById('modalClose');

        ofertaBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeOfertaModal = () => {
            modalOverlay.classList.remove('active');
            if (!purchaseModalOverlay.classList.contains('active')) {
                document.body.style.overflow = '';
            }
        };

        modalClose.addEventListener('click', closeOfertaModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeOfertaModal();
        });

        // Modal 2: Логика для окна покупки подписки
        const purchaseModalOverlay = document.getElementById('purchaseModalOverlay');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const purchaseModalClose = document.getElementById('purchaseModalClose');
        const purchaseModalOkBtn = document.getElementById('purchaseModalOkBtn');

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                purchaseModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        const closePurchaseModal = () => {
            purchaseModalOverlay.classList.remove('active');
            if (!modalOverlay.classList.contains('active')) {
                document.body.style.overflow = '';
            }
        };

        purchaseModalClose.addEventListener('click', closePurchaseModal);
        purchaseModalOkBtn.addEventListener('click', closePurchaseModal);
        purchaseModalOverlay.addEventListener('click', (e) => {
            if (e.target === purchaseModalOverlay) closePurchaseModal();
        });

        // Общий обработчик на клавишу Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modalOverlay.classList.remove('active');
                purchaseModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
