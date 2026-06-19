import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Layers, Settings2 } from "lucide-react";
import Toolbar from "./Toolbar";
import StepsSidebar from "./StepsSidebar";
import StepEditor from "./StepEditor";
import FieldEditorPanel from "./FieldEditorPanel";
import FormMetadataEditor from "./FormMetadataEditor";
import type { useMembershipFormBuilder } from "@/hooks/useMembershipFormBuilder";

interface FormBuilderShellProps {
  builder: ReturnType<typeof useMembershipFormBuilder>;
  previewUrl: string;
  readOnly?: boolean;
}

const FormBuilderShell = ({ builder, previewUrl, readOnly }: FormBuilderShellProps) => {
  const [activeTab, setActiveTab] = useState<string>("steps");

  if (builder.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-sakura" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <Toolbar
        formRecord={builder.formRecord}
        isDirty={builder.isDirty}
        isSaving={builder.isSaving}
        onSave={builder.saveDraft}
        previewUrl={previewUrl}
        readOnly={readOnly}
      />

      {/* Tabs for Steps vs Metadata */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/30 bg-[#111]">
          <TabsList className="bg-transparent rounded-none h-auto p-0 gap-0">
            <TabsTrigger
              value="steps"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-sakura data-[state=active]:bg-transparent px-4 py-2 text-xs gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Etapes & Champs
            </TabsTrigger>
            <TabsTrigger
              value="metadata"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-sakura data-[state=active]:bg-transparent px-4 py-2 text-xs gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Metadonnees
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Steps & Fields tab */}
        <TabsContent value="steps" className="flex-1 overflow-hidden m-0">
          <div className="flex h-full">
            {/* Steps sidebar */}
            <StepsSidebar
              steps={builder.definition.steps}
              selectedStepId={builder.selectedStepId}
              onSelectStep={(id) => {
                builder.setSelectedStepId(id);
                builder.setSelectedFieldKey(null);
              }}
              onAddStep={builder.addStep}
              onRemoveStep={builder.removeStep}
              onDuplicateStep={builder.duplicateStep}
              onReorderSteps={builder.reorderSteps}
            />

            {/* Step editor (central) */}
            {builder.selectedStep ? (
              <StepEditor
                step={builder.selectedStep}
                onUpdateStep={(updates) =>
                  builder.updateStep(builder.selectedStepId!, updates)
                }
                onAddField={(type) => builder.addField(builder.selectedStepId!, type)}
                onRemoveField={(key) => builder.removeField(builder.selectedStepId!, key)}
                onDuplicateField={(key) => builder.duplicateField(builder.selectedStepId!, key)}
                onReorderFields={(from, to) =>
                  builder.reorderFields(builder.selectedStepId!, from, to)
                }
                selectedFieldKey={builder.selectedFieldKey}
                onSelectField={builder.setSelectedFieldKey}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selectionne une etape a gauche</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    ou cree-en une nouvelle
                  </p>
                </div>
              </div>
            )}

            {/* Field editor panel (right) */}
            {builder.selectedField && builder.selectedStepId && (
              <FieldEditorPanel
                field={builder.selectedField}
                stepId={builder.selectedStepId}
                allFieldKeys={builder.allFieldKeys}
                onUpdate={(updates) =>
                  builder.updateField(
                    builder.selectedStepId!,
                    builder.selectedFieldKey!,
                    updates
                  )
                }
                onClose={() => builder.setSelectedFieldKey(null)}
              />
            )}
          </div>
        </TabsContent>

        {/* Metadata tab */}
        <TabsContent value="metadata" className="flex-1 overflow-y-auto m-0">
          <FormMetadataEditor
            definition={builder.definition}
            onUpdate={builder.updateMetadata}
            formName={builder.formRecord?.name}
            formSeason={builder.formRecord?.season || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormBuilderShell;
