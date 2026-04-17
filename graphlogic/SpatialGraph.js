class SpatialGraph {
    /**
     * @param {Array} words - Array of text items from OCR. 
     *                        Expected format: { text: string, bbox: { x0, y0, x1, y1 } }
     */
    constructor(words) {
        this.nodes = words.map((w, index) => ({
            id: index,
            text: w.text,
            x0: w.bbox.x0,
            y0: w.bbox.y0,
            x1: w.bbox.x1,
            y1: w.bbox.y1,
            // Calculate center points for easier overlap calculation
            cx: (w.bbox.x0 + w.bbox.x1) / 2,
            cy: (w.bbox.y0 + w.bbox.y1) / 2,
            right: null,
            bottom: null,
        }));
        this.buildGraph();
    }

    /**
     * Builds spatial relationships between nodes based on their coordinates.
     */
    buildGraph() {
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];
            
            // Find Candidate for 'right' neighbor
            // Condition: Must be to the right (x0 > x1), and vertically overlapping (cy within [y0, y1])
            let rightCandidates = this.nodes.filter(n => 
                n.id !== node.id &&
                n.x0 >= node.x1 && 
                n.cy >= node.y0 - 5 && n.cy <= node.y1 + 5 // 5px tolerance for slight skews
            );
            
            if (rightCandidates.length > 0) {
                // Sort by closest distance horizontally
                rightCandidates.sort((a, b) => (a.x0 - node.x1) - (b.x0 - node.x1));
                node.right = rightCandidates[0];
            }

            // Find Candidate for 'bottom' neighbor
            // Condition: Must be below (y0 > y1), and horizontally overlapping (cx within [x0, x1])
            let bottomCandidates = this.nodes.filter(n =>
                n.id !== node.id &&
                n.y0 >= node.y1 && 
                n.cx >= node.x0 - 10 && n.cx <= node.x1 + 10 // 10px tolerance
            );
            
            if (bottomCandidates.length > 0) {
                // Sort by closest distance vertically
                bottomCandidates.sort((a, b) => (a.y0 - node.y1) - (b.y0 - node.y1));
                node.bottom = bottomCandidates[0];
            }
        }
    }

    /**
     * Find a node containing the exact or partial text
     * @param {string} text 
     */
    findNodeByText(text) {
        return this.nodes.find(n => n.text.toLowerCase().includes(text.toLowerCase()));
    }

    /**
     * Extracts values based on a given schema
     * 
     * Schema Example:
     * {
     *   "invoice_number": { search_text: "Invoice No", direction: "right" },
     *   "total_amount": { search_text: "Total", direction: "bottom" }
     * }
     */
    extract(schema) {
        const result = {};

        for (const key in schema) {
            const config = schema[key];
            const startNode = this.findNodeByText(config.search_text || key);
            
            if (!startNode) {
                result[key] = null;
                continue;
            }

            result[key] = this.getValueForNode(startNode, config.direction);
        }

        return result;
    }

    getValueForNode(startNode, direction) {
        let nextNode = startNode[direction];
        if (!nextNode) return null;

        let valueTokens = [nextNode.text];
        
        // Always try to gather everything to the right of the found target
        // For example if direction=bottom lands on "1,000", we want to grab "USD" directly to its right
        let rNode = nextNode.right;
        
        // Hard limit to prevent infinite loops if OCR boxes overlap perfectly forming a cycle
        let maxLimit = 10; 
        while (rNode && maxLimit > 0) {
            valueTokens.push(rNode.text);
            rNode = rNode.right;
            maxLimit--;
        }

        return valueTokens.join(' ').trim();
    }
}

module.exports = SpatialGraph;
