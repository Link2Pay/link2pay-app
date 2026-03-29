use soroban_sdk::{Bytes, BytesN, Env, Vec};
use crate::types::MerkleProof;

const TREE_DEPTH: u32 = 10;

pub struct SparseMerkleTree {
    zeros: [BytesN<32>; TREE_DEPTH as usize],
}

impl SparseMerkleTree {
    pub fn new(env: &Env) -> Self {
        // Pre-compute zero values for each level
        // zeros[0] = hash(0)
        // zeros[i] = hash(zeros[i-1], zeros[i-1])
        //
        // For Poseidon hash, we'll use placeholder hashes for now
        // These will need to match the circuit's zero values exactly
        // TODO: Generate these using soroban-poseidon or match circomlib values

        let mut zeros: [BytesN<32>; TREE_DEPTH as usize] = [
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
            BytesN::from_array(env, &[0u8; 32]),
        ];

        // Level 0: hash of empty leaf
        zeros[0] = Self::hash_two(env, &BytesN::from_array(env, &[0u8; 32]), &BytesN::from_array(env, &[0u8; 32]));

        // Each subsequent level
        for i in 1..TREE_DEPTH as usize {
            zeros[i] = Self::hash_two(env, &zeros[i - 1], &zeros[i - 1]);
        }

        Self { zeros }
    }

    /// Compute Merkle root from commitments
    pub fn get_root(&self, commitments: &Vec<BytesN<32>>) -> BytesN<32> {
        let env = commitments.env();
        let leaf_count = commitments.len();

        if leaf_count == 0 {
            // Empty tree root is the zero value at max depth
            return self.zeros[TREE_DEPTH as usize - 1].clone();
        }

        // Build tree bottom-up
        let mut current_level = commitments.clone();

        for level in 0..TREE_DEPTH {
            let mut next_level = Vec::new(&env);
            let level_size = current_level.len();

            let mut i = 0;
            while i < level_size {
                let left = current_level.get(i).unwrap();
                let right = if i + 1 < level_size {
                    current_level.get(i + 1).unwrap()
                } else {
                    self.zeros[level as usize].clone()
                };

                let parent = Self::hash_two(&env, &left, &right);
                next_level.push_back(parent);
                i += 2;
            }

            // If we're at a level with only one node and it's not the root level,
            // we need to pad with zeros up to the root
            if next_level.len() == 1 && level < TREE_DEPTH - 1 {
                let mut node = next_level.get(0).unwrap();
                for l in (level + 1)..TREE_DEPTH {
                    node = Self::hash_two(&env, &node, &self.zeros[l as usize]);
                }
                return node;
            }

            current_level = next_level;

            if current_level.len() == 1 {
                return current_level.get(0).unwrap();
            }
        }

        current_level.get(0).unwrap()
    }

    /// Generate Merkle proof for leaf at index
    pub fn get_proof(&self, commitments: &Vec<BytesN<32>>, leaf_index: u32) -> MerkleProof {
        let env = commitments.env();
        let leaf = commitments.get(leaf_index).unwrap();

        let mut path_elements = Vec::new(&env);
        let mut path_indices = Vec::new(&env);

        let mut index = leaf_index;
        let mut current_level = commitments.clone();

        for level in 0..TREE_DEPTH {
            let is_right = index % 2 == 1;
            path_indices.push_back(is_right);

            let sibling_index = if is_right { index - 1 } else { index + 1 };

            let sibling = if sibling_index < current_level.len() {
                current_level.get(sibling_index).unwrap()
            } else {
                self.zeros[level as usize].clone()
            };

            path_elements.push_back(sibling);

            // Move to next level
            let mut next_level = Vec::new(&env);
            let level_size = current_level.len();

            let mut i = 0;
            while i < level_size {
                let left = current_level.get(i).unwrap();
                let right = if i + 1 < level_size {
                    current_level.get(i + 1).unwrap()
                } else {
                    self.zeros[level as usize].clone()
                };

                let parent = Self::hash_two(&env, &left, &right);
                next_level.push_back(parent);
                i += 2;
            }

            current_level = next_level;
            index = index / 2;

            if current_level.len() <= 1 {
                break;
            }
        }

        MerkleProof {
            leaf,
            path_elements,
            path_indices,
        }
    }

    /// Hash two nodes together
    /// TODO: Replace with Poseidon hash using soroban-poseidon
    /// For now, using SHA256 as placeholder
    fn hash_two(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
        // Concatenate left and right
        let mut data = Bytes::new(env);
        for byte in left.to_array() {
            data.push_back(byte);
        }
        for byte in right.to_array() {
            data.push_back(byte);
        }

        // Hash with SHA256 and convert to BytesN
        BytesN::from_array(env, &env.crypto().sha256(&data).to_array())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_empty_tree_root() {
        let env = Env::default();
        let merkle = SparseMerkleTree::new(&env);
        let commitments = Vec::new(&env);
        let root = merkle.get_root(&commitments);

        // Empty tree should return the zero value at max depth
        assert_eq!(root, merkle.zeros[TREE_DEPTH as usize - 1]);
    }

    #[test]
    fn test_single_commitment() {
        let env = Env::default();
        let merkle = SparseMerkleTree::new(&env);

        let mut commitments = Vec::new(&env);
        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        commitments.push_back(commitment.clone());

        let root = merkle.get_root(&commitments);

        // Root should not be zero
        assert_ne!(root, merkle.zeros[TREE_DEPTH as usize - 1]);
    }

    #[test]
    fn test_merkle_proof() {
        let env = Env::default();
        let merkle = SparseMerkleTree::new(&env);

        let mut commitments = Vec::new(&env);
        commitments.push_back(BytesN::from_array(&env, &[1u8; 32]));
        commitments.push_back(BytesN::from_array(&env, &[2u8; 32]));

        let proof = merkle.get_proof(&commitments, 0);

        // Proof should have TREE_DEPTH elements
        assert_eq!(proof.path_elements.len(), TREE_DEPTH);
        assert_eq!(proof.path_indices.len(), TREE_DEPTH);
    }
}
