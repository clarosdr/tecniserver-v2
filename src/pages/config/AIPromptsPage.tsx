import React, { useState, useEffect } from 'react';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Plus, Edit, Eye, Trash2, Save, X, Tag, Calendar, User, FileText } from 'lucide-react';
import {
  listPrompts,
  createOrUpdatePrompt,
  getPrompt,
  deactivatePrompt,
  AIPrompt
} from '../../services/ai';
import { toast } from 'sonner';

const CATEGORIAS = [
  'General',
  'Soporte Técnico',
  'Ventas',
  'Marketing',
  'Documentación',
  'Análisis',
  'Traducción',
  'Corrección',
  'Personalizado'
];

interface CreatePromptParams {
  nombre: string;
  descripcion: string;
  template: string;
  variables: string[];
  categoria: string;
  activo: boolean;
}

interface UpdatePromptParams extends CreatePromptParams {
  id: number;
}

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<AIPrompt | null>(null);
  const [formData, setFormData] = useState<CreatePromptParams>({
    nombre: '',
    descripcion: '',
    template: '',
    variables: [],
    categoria: 'General',
    activo: true
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await listPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.error('Error al cargar los prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrompt) {
        await createOrUpdatePrompt({ ...formData, id: editingPrompt.id });
      } else {
        await createOrUpdatePrompt(formData);
      }
      toast.success(editingPrompt ? 'Prompt actualizado' : 'Prompt creado');
      setShowForm(false);
      resetForm();
      loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Error al guardar el prompt');
    }
  };

  const handleEdit = async (prompt: AIPrompt) => {
    try {
      const fullPrompt = await getPrompt(prompt.id);
      if (fullPrompt) {
        setEditingPrompt(fullPrompt);
        setFormData({
          nombre: fullPrompt.nombre,
          descripcion: fullPrompt.descripcion || '',
          template: fullPrompt.template,
          variables: fullPrompt.variables,
          categoria: fullPrompt.categoria,
          activo: fullPrompt.activo
        });
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error loading prompt for edit:', error);
      toast.error('Error al cargar el prompt');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres desactivar este prompt?')) {
      try {
        await deactivatePrompt(Number(id));
        toast.success('Prompt desactivado');
        loadPrompts();
      } catch (error) {
        console.error('Error deactivating prompt:', error);
        toast.error('Error al desactivar el prompt');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      template: '',
      variables: [],
      categoria: 'General',
      activo: true
    });
    setEditingPrompt(null);
  };

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches.map(match => match.slice(2, -2)))] : [];
  };

  const handleTemplateChange = (template: string) => {
    const variables = extractVariables(template);
    setFormData(prev => ({ ...prev, template, variables }));
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.template.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'General': 'bg-gray-100 text-gray-800',
      'Soporte Técnico': 'bg-blue-100 text-blue-800',
      'Ventas': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'Documentación': 'bg-yellow-100 text-yellow-800',
      'Análisis': 'bg-red-100 text-red-800',
      'Traducción': 'bg-indigo-100 text-indigo-800',
      'Corrección': 'bg-pink-100 text-pink-800',
      'Personalizado': 'bg-orange-100 text-orange-800'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Prompts</h1>
          <p className="text-gray-600">Gestión de plantillas para interacciones con AI</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? 'Editar Prompt' : 'Nuevo Prompt'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Breve descripción del propósito del prompt"
                />
              </div>

              <div>
                <Label htmlFor="template">Template *</Label>
                <Textarea
                  id="template"
                  value={formData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  placeholder="Escribe tu prompt aquí. Usa {{variable}} para variables dinámicas."
                  rows={8}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Usa dobles llaves para variables: {'{{nombre}}'}, {'{{empresa}}'}, etc.
                </p>
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <Label>Variables detectadas:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
                <Label htmlFor="activo">Prompt activo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPrompt ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIAS.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{prompt.nombre}</CardTitle>
                  <Badge className={getCategoryColor(prompt.categoria)}>
                    {prompt.categoria}
                  </Badge>
                </div>
                <Badge variant={prompt.activo ? 'default' : 'secondary'}>
                  {prompt.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {prompt.descripcion && (
                <p className="text-sm text-gray-600">{prompt.descripcion}</p>
              )}

              <div className="text-xs text-gray-500">
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="h-3 w-3" />
                  <span>Variables: {prompt.variables.length}</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  <span>Creado: {new Date(prompt.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>ID: {prompt.user_id.slice(0, 8)}...</span>
                </div>
              </div>

              {prompt.variables.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {prompt.variables.slice(0, 3).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {prompt.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{prompt.variables.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingPrompt(prompt)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(prompt)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                {prompt.activo && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeactivate(prompt.id)}
                  >
                    Desactivar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No se encontraron prompts</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para ver prompt completo */}
      <Dialog open={!!viewingPrompt} onOpenChange={() => setViewingPrompt(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingPrompt?.nombre}</DialogTitle>
          </DialogHeader>
          {viewingPrompt && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(viewingPrompt.categoria)}>
                  {viewingPrompt.categoria}
                </Badge>
                <Badge variant={viewingPrompt.activo ? 'default' : 'secondary'}>
                  {viewingPrompt.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {viewingPrompt.descripcion && (
                <div>
                  <Label>Descripción:</Label>
                  <p className="text-gray-700 mt-1">{viewingPrompt.descripcion}</p>
                </div>
              )}

              <div>
                <Label>Template:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <pre className="whitespace-pre-wrap text-sm">{viewingPrompt.template}</pre>
                </div>
              </div>

              {viewingPrompt.variables.length > 0 && (
                <div>
                  <Label>Variables ({viewingPrompt.variables.length}):</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewingPrompt.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 border-t pt-3">
                <p>Creado: {new Date(viewingPrompt.created_at).toLocaleString()}</p>
                <p>Actualizado: {new Date(viewingPrompt.updated_at).toLocaleString()}</p>
                <p>Usuario: {viewingPrompt.user_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}