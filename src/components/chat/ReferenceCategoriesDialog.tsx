import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ListChecks, Plus, X, Pencil } from 'lucide-react';

export type CategoryBlocks = Record<string, string[]>;

interface ReferenceCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseCategories: CategoryBlocks;
  incomeCategories: CategoryBlocks;
  onChangeExpenseCategories?: (categories: CategoryBlocks) => void;
  onChangeIncomeCategories?: (categories: CategoryBlocks) => void;
}

export const ReferenceCategoriesDialog: React.FC<ReferenceCategoriesDialogProps> = ({
  open,
  onOpenChange,
  expenseCategories,
  incomeCategories,
  onChangeExpenseCategories,
  onChangeIncomeCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');
  const [editCategories, setEditCategories] = useState({
    expenses: JSON.parse(JSON.stringify(expenseCategories)),
    income: JSON.parse(JSON.stringify(incomeCategories)),
  });
  const [newBlock, setNewBlock] = useState('');
  const [newCategory, setNewCategory] = useState<Record<string, string>>({});
  const [editBlockName, setEditBlockName] = useState<Record<string, string>>({});
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  const handleAddBlock = () => {
    if (!newBlock.trim()) return;
    setEditCategories(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [newBlock.trim()]: [],
      }
    }));
    setNewBlock('');
  };

  const handleDeleteBlock = (block: string) => {
    setEditCategories(prev => {
      const copy = { ...prev[activeTab] };
      delete copy[block];
      return { ...prev, [activeTab]: copy };
    });
  };

  const handleEditBlockName = (block: string) => {
    const newName = editBlockName[block]?.trim();
    if (!newName || newName === block) return;
    setEditCategories(prev => {
      const copy = { ...prev[activeTab] };
      copy[newName] = copy[block];
      delete copy[block];
      return { ...prev, [activeTab]: copy };
    });
    setEditBlockName(prev => ({ ...prev, [block]: '' }));
    setEditingBlock(null);
  };

  const handleAddCategory = (block: string) => {
    const value = newCategory[block]?.trim();
    if (!value) return;
    setEditCategories(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [block]: [...prev[activeTab][block], value],
      }
    }));
    setNewCategory(prev => ({ ...prev, [block]: '' }));
  };

  const handleDeleteCategory = (block: string, idx: number) => {
    setEditCategories(prev => {
      const copy = { ...prev[activeTab] };
      copy[block] = copy[block].filter((_:any, i:any) => i !== idx);
      return { ...prev, [activeTab]: copy };
    });
  };

  const handleSave = () => {
    if (onChangeExpenseCategories && activeTab === 'expenses') {
      onChangeExpenseCategories(editCategories.expenses);
    }
    if (onChangeIncomeCategories && activeTab === 'income') {
      onChangeIncomeCategories(editCategories.income);
    }
    onOpenChange(false);
  };

  const renderBlock = (block: string, categories: string[]) => (
    <div key={block} className="mb-4 border rounded p-2 bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        {editingBlock === block ? (
          <>
            <input
              className="border px-1 text-xs rounded mr-2"
              value={editBlockName[block] ?? block}
              onChange={e => setEditBlockName(prev => ({ ...prev, [block]: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleEditBlockName(block); }}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditBlockName(block)} title="Guardar nombre">
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-semibold text-xs flex-1">{block}</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingBlock(block)} title="Editar bloque">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDeleteBlock(block)} title="Eliminar bloque">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {categories.map((cat, idx) => (
          <span key={cat + idx} className="inline-flex items-center bg-white border rounded px-2 py-0.5 text-xs mr-1 mb-1">
            {cat}
            <button className="ml-1 text-red-500 hover:text-red-700" onClick={() => handleDeleteCategory(block, idx)} title="Eliminar categoría">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-1">
        <input
          className="border px-1 text-xs rounded flex-1"
          placeholder="Nueva categoría"
          value={newCategory[block] || ''}
          onChange={e => setNewCategory(prev => ({ ...prev, [block]: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(block); }}
        />
        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => handleAddCategory(block)} title="Añadir categoría">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 text-xs h-8">
          <ListChecks className="mr-2 h-4 w-4" />
          Ver categorías de referencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Categorías de referencia</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={v => setActiveTab(v as 'expenses' | 'income')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="income">Ingresos</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses" className="flex-1 overflow-hidden mt-2">
            <ScrollArea className="h-full p-1 pr-3">
              <div className="space-y-2">
                {Object.entries(editCategories.expenses).map(([block, cats]) => renderBlock(block, cats as string[]))}
                <div className="flex gap-2 mt-2">
                  <input
                    className="border px-1 text-xs rounded flex-1"
                    placeholder="Nuevo bloque de gastos"
                    value={newBlock}
                    onChange={e => setNewBlock(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddBlock(); }}
                  />
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleAddBlock} title="Añadir bloque">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="income" className="flex-1 overflow-hidden mt-2">
            <ScrollArea className="h-full p-1 pr-3">
              <div className="space-y-2">
                {Object.entries(editCategories.income).map(([block, cats]) => renderBlock(block, cats as string[]))}
                <div className="flex gap-2 mt-2">
                  <input
                    className="border px-1 text-xs rounded flex-1"
                    placeholder="Nuevo bloque de ingresos"
                    value={newBlock}
                    onChange={e => setNewBlock(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddBlock(); }}
                  />
                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleAddBlock} title="Añadir bloque">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" variant="default" onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};