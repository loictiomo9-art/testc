class ChessAI {
    constructor(engine, strength = 1500) {
        this.engine = engine;
        this.strength = strength;
        this.maxDepth = this.calculateDepth(strength);
        this.pieceValues = {
            'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
        };
    }
    
    calculateDepth(elo) {
        // Ajustement de la profondeur selon le niveau ELO
        if (elo <= 1000) return 1;
        if (elo <= 1200) return 2;
        if (elo <= 1400) return 2;
        if (elo <= 1600) return 3;
        if (elo <= 1800) return 3;
        return 4;
    }
    
    evaluateBoard() {
        let score = 0;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.engine.board[r][c];
                if (!piece) continue;
                
                const pieceType = piece.toLowerCase();
                const value = this.pieceValues[pieceType] || 0;
                
                // Bonus de position pour les pièces
                const positionBonus = this.getPositionBonus(piece, r, c);
                
                if (piece === piece.toUpperCase()) {
                    // Pièce blanche (joueur)
                    score += value + positionBonus;
                } else {
                    // Pièce noire (IA)
                    score -= value + positionBonus;
                }
            }
        }
        
        // Bonus pour le contrôle du centre
        const centerControl = this.evaluateCenterControl();
        score += centerControl;
        
        return score;
    }
    
    getPositionBonus(piece, row, col) {
        const pieceType = piece.toLowerCase();
        const isWhite = piece === piece.toUpperCase();
        const r = isWhite ? row : 7 - row;
        const c = col;
        
        // Tables simplifiées de bonus positionnels
        const pawnTable = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ];
        
        const knightTable = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ];
        
        const bishopTable = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ];
        
        if (pieceType === 'p') return pawnTable[r][c];
        if (pieceType === 'n') return knightTable[r][c];
        if (pieceType === 'b') return bishopTable[r
