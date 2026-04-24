const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
 
app.get('/', (req, res) => {
    res.send('BFHL Server is running. Use POST /bfhl for processing.');
});
 
app.get('/bfhl', (req, res) => {
    res.status(200).json({ operation_code: 1 });
});

// Replace these with your actual credentials
const USER_ID = "avinash_24042026";
const EMAIL_ID = "avinash@college.edu";
const COLLEGE_ROLL_NUMBER = "21CS1001";

app.post('/bfhl', (req, res) => {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ is_success: false, message: "Invalid input format. 'data' array is required." });
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const valid_edges = [];
    const seen_edges = new Set();
    const children_with_parents = new Map(); // child -> parent

    // 1. Validation and Duplicate Filtering
    data.forEach(entry => {
        const trimmed = entry.trim();
        const match = trimmed.match(/^([A-Z])->([A-Z])$/);

        if (!match) {
            invalid_entries.push(entry);
            return;
        }

        const [_, parent, child] = match;

        if (parent === child) {
            invalid_entries.push(entry); // Self-loop treated as invalid
            return;
        }

        const edgeStr = `${parent}->${child}`;
        if (seen_edges.has(edgeStr)) {
            if (!duplicate_edges.includes(edgeStr)) {
                duplicate_edges.push(edgeStr);
            }
            return;
        }

        seen_edges.add(edgeStr);

        // Rule: Multi-parent case - first parent wins
        if (!children_with_parents.has(child)) {
            children_with_parents.set(child, parent);
            valid_edges.push({ parent, child });
        }
        // If child already has a parent, this edge is "silently discarded" per rule 4
    });

    // 2. Group Nodes into Components
    const all_nodes = new Set();
    const adj = new Map();
    valid_edges.forEach(e => {
        all_nodes.add(e.parent);
        all_nodes.add(e.child);
        if (!adj.has(e.parent)) adj.set(e.parent, []);
        adj.get(e.parent).push(e.child);
    });

    // Helper to find connected components (ignorig direction for grouping)
    const undirected_adj = new Map();
    all_nodes.forEach(n => undirected_adj.set(n, []));
    valid_edges.forEach(e => {
        undirected_adj.get(e.parent).push(e.child);
        undirected_adj.get(e.child).push(e.parent);
    });

    const visited = new Set();
    const groups = [];

    all_nodes.forEach(node => {
        if (!visited.has(node)) {
            const group = [];
            const queue = [node];
            visited.add(node);
            while (queue.length > 0) {
                const u = queue.shift();
                group.push(u);
                (undirected_adj.get(u) || []).forEach(v => {
                    if (!visited.has(v)) {
                        visited.add(v);
                        queue.push(v);
                    }
                });
            }
            groups.push(group);
        }
    });

    // 3. Process Each Group
    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let deepest_tree = { root: null, depth: -1 };

    groups.forEach(group => {
        const group_nodes = new Set(group);
        const in_group_adj = new Map();
        const in_degree = new Map();
        group.forEach(n => {
            in_group_adj.set(n, (adj.get(n) || []).filter(c => group_nodes.has(c)));
            if (!in_degree.has(n)) in_degree.set(n, 0);
        });
        
        group.forEach(n => {
            in_group_adj.get(n).forEach(c => {
                in_degree.set(c, (in_degree.get(c) || 0) + 1);
            });
        });

        // Identify roots
        let roots = group.filter(n => (in_degree.get(n) || 0) === 0);
        let root;
        let has_cycle = false;

        if (roots.length === 0) {
            // Pure cycle case
            has_cycle = true;
            root = group.sort()[0]; // lexicographical smallest
        } else {
            // Usually there's one root per tree because of "first parent wins"
            // If there were multiple roots in a connected component, it would be weird
            // but we pick the smallest one if multiple? Actually, Rule 4 says 
            // "A root is a node that never appears as a child in any valid edge."
            root = roots.sort()[0];
        }

        // Cycle Detection with DFS
        const dfs_visited = new Set();
        const rec_stack = new Set();
        function checkCycle(u) {
            dfs_visited.add(u);
            rec_stack.add(u);
            const neighbors = in_group_adj.get(u) || [];
            for (const v of neighbors) {
                if (!dfs_visited.has(v)) {
                    if (checkCycle(v)) return true;
                } else if (rec_stack.has(v)) {
                    return true;
                }
            }
            rec_stack.delete(u);
            return false;
        }

        // Since it's a connected group, we check cycle from root if possible, 
        // but for pure cycles we need to check from any node.
        if (!has_cycle) {
            // Even if we identified a root, there could be a disjoint cycle 
            // but here groups are connected components, so if there's a root and a cycle, 
            // the cycle must be reachable from somewhere.
            // Wait, "total_cycles" counts "cyclic groups".
            // A group is cyclic if DFS finds a back-edge.
            for (const node of group) {
                if (!dfs_visited.has(node)) {
                    if (checkCycle(node)) {
                        has_cycle = true;
                        break;
                    }
                }
            }
        }

        if (has_cycle) {
            total_cycles++;
            hierarchies.push({
                root: root,
                tree: {},
                has_cycle: true
            });
        } else {
            total_trees++;
            const tree_obj = {};
            function buildTree(u) {
                const node_tree = {};
                const children = (in_group_adj.get(u) || []).sort();
                children.forEach(c => {
                    node_tree[c] = buildTree(c);
                });
                return node_tree;
            }
            
            tree_obj[root] = buildTree(root);

            function getDepth(u) {
                const children = in_group_adj.get(u) || [];
                if (children.length === 0) return 1;
                let max_child_depth = 0;
                children.forEach(c => {
                    max_child_depth = Math.max(max_child_depth, getDepth(c));
                });
                return 1 + max_child_depth;
            }

            const depth = getDepth(root);
            hierarchies.push({
                root: root,
                tree: tree_obj,
                depth: depth
            });

            if (depth > deepest_tree.depth) {
                deepest_tree = { root, depth };
            } else if (depth === deepest_tree.depth) {
                // Tiebreaker: lexicographical smaller root
                if (!deepest_tree.root || root < deepest_tree.root) {
                    deepest_tree = { root, depth };
                }
            }
        }
    });

    const response = {
        user_id: USER_ID,
        email_id: EMAIL_ID,
        college_roll_number: COLLEGE_ROLL_NUMBER,
        hierarchies: hierarchies,
        invalid_entries: invalid_entries,
        duplicate_edges: duplicate_edges,
        summary: {
            total_trees: total_trees,
            total_cycles: total_cycles,
            largest_tree_root: deepest_tree.root || ""
        }
    };

    res.json(response);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
