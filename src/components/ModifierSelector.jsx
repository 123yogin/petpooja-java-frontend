import { useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function ModifierSelector({ menuItemId, onModifiersSelected, isOpen, onClose }) {
  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && menuItemId) {
      loadModifierGroups();
    }
  }, [isOpen, menuItemId]);

  const loadModifierGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/modifiers/menu-items/${menuItemId}/modifier-groups`);
      
      // The API now returns DTOs with modifiers already included, no circular references
      // Handle case where response might be a string (JSON) or already parsed
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (typeof res.data === 'string') {
        // If it's a string, parse it as JSON
        try {
          data = JSON.parse(res.data);
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          data = [];
        }
      } else if (res.data && typeof res.data === 'object') {
        // If it's an object, try to extract an array from it
        data = res.data.data || res.data.items || [];
      }
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [];
      }
      
      const groupsWithModifiers = data.map((link) => {
        const group = link.modifierGroup || link;
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          isRequired: group.isRequired,
          allowMultiple: group.allowMultiple,
          minSelection: group.minSelection,
          maxSelection: group.maxSelection,
          isActive: group.isActive,
          modifiers: group.modifiers || []
        };
      });
      setModifierGroups(groupsWithModifiers);
      setSelectedModifiers([]);
    } catch (err) {
      console.error("Error loading modifier groups:", err);
      // If no modifier groups found, that's okay - item just has no modifiers
      setModifierGroups([]);
      setSelectedModifiers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModifier = (modifier, group) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.modifierId === modifier.id);
      
      if (group.allowMultiple) {
        // Can select multiple
        if (exists) {
          return prev.filter((m) => m.modifierId !== modifier.id);
        } else {
          return [...prev, { modifierId: modifier.id, name: modifier.name, price: modifier.price }];
        }
      } else {
        // Can only select one from this group - remove others from same group first
        const otherModifiersInGroup = prev.filter((m) => {
          const modGroup = modifierGroups.find(g => 
            g.modifiers?.some(mod => mod.id === m.modifierId)
          );
          return modGroup?.id === group.id;
        });
        const withoutGroup = prev.filter((m) => 
          !otherModifiersInGroup.some(om => om.modifierId === m.modifierId)
        );
        return [...withoutGroup, { modifierId: modifier.id, name: modifier.name, price: modifier.price }];
      }
    });
  };

  const isModifierSelected = (modifierId) => {
    return selectedModifiers.some((m) => m.modifierId === modifierId);
  };

  const validateSelection = () => {
    for (const group of modifierGroups) {
      if (group.isRequired) {
        const selectedInGroup = selectedModifiers.filter((m) => {
          return group.modifiers?.some(mod => mod.id === m.modifierId);
        });
        
        if (selectedInGroup.length < (group.minSelection || 1)) {
          toast.error(`${group.name} requires at least ${group.minSelection || 1} selection(s)`);
          return false;
        }
        
        if (group.maxSelection && selectedInGroup.length > group.maxSelection) {
          toast.error(`${group.name} allows maximum ${group.maxSelection} selection(s)`);
          return false;
        }
      }
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateSelection()) {
      return;
    }
    onModifiersSelected(selectedModifiers);
    onClose();
  };

  if (!isOpen) return null;

  const totalModifierPrice = selectedModifiers.reduce((sum, m) => sum + (m.price || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Modifiers</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading modifiers...</p>
          </div>
        ) : modifierGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No modifiers available for this item
          </div>
        ) : (
          <>
            {modifierGroups.map((group) => {
              const activeModifiers = group.modifiers?.filter(m => m.isActive) || [];
              if (activeModifiers.length === 0) return null;
              
              return (
                <div key={group.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {group.name}
                    {group.isRequired && <span className="text-red-500 ml-1">*</span>}
                    {group.allowMultiple && <span className="text-xs text-gray-500 ml-2">(Multiple allowed)</span>}
                  </h4>
                  {group.description && (
                    <p className="text-xs text-gray-500 mb-3">{group.description}</p>
                  )}
                  <div className="space-y-2">
                    {activeModifiers.map((modifier) => {
                      const isSelected = isModifierSelected(modifier.id);
                      return (
                        <label
                          key={modifier.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-black bg-gray-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            <input
                              type={group.allowMultiple ? "checkbox" : "radio"}
                              name={group.allowMultiple ? `modifier-${modifier.id}` : `group-${group.id}`}
                              checked={isSelected}
                              onChange={() => toggleModifier(modifier, group)}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <span className="text-gray-900">{modifier.name}</span>
                              {modifier.description && (
                                <p className="text-xs text-gray-500 mt-1">{modifier.description}</p>
                              )}
                            </div>
                          </div>
                          {modifier.price > 0 && (
                            <span className="text-gray-600 font-medium ml-4">+₹{modifier.price.toFixed(2)}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {totalModifierPrice > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Additional cost: <span className="font-semibold text-gray-900">+₹{totalModifierPrice.toFixed(2)}</span>
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

