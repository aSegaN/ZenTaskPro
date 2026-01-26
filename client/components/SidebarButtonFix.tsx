/**
 * FIX: Button imbriqué dans Sidebar
 * 
 * PROBLÈME:
 * Le warning "In HTML, <button> cannot be a descendant of <button>"
 * apparaît quand on a cette structure :
 * 
 * <button onClick={navigateToProject}>
 *     <span>Project Name</span>
 *     <button onClick={deleteProject}>  ← INTERDIT !
 *         <Trash />
 *     </button>
 * </button>
 * 
 * SOLUTION:
 * Utiliser un <div> avec role="button" pour le conteneur,
 * ou repositionner le bouton de suppression à l'extérieur.
 */

// ❌ AVANT (incorrect)
const ProjectItemBefore = ({ project, onSelect, onDelete }) => (
    <button
        onClick={() => onSelect(project.id)}
        className="flex items-center w-full px-5 py-3 rounded-2xl"
    >
        <span>{project.name}</span>
        <button
            onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
            }}
            className="p-1 text-red-500"
        >
            <Trash className="w-4 h-4" />
        </button>
    </button>
);

// ✅ APRÈS (correct) - Option 1: div avec role="button"
const ProjectItemAfter1 = ({ project, onSelect, onDelete }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(project.id)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(project.id)}
        className="flex items-center w-full px-5 py-3 rounded-2xl cursor-pointer group"
    >
        <span>{project.name}</span>
        <button
            onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-500"
        >
            <Trash className="w-4 h-4" />
        </button>
    </div>
);

// ✅ APRÈS (correct) - Option 2: Structure flex avec boutons séparés
const ProjectItemAfter2 = ({ project, onSelect, onDelete }) => (
    <div className="flex items-center group">
        <button
            onClick={() => onSelect(project.id)}
            className="flex-1 flex items-center px-5 py-3 rounded-l-2xl"
        >
            <span>{project.name}</span>
        </button>
        <button
            onClick={() => onDelete(project.id)}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-r-2xl text-red-500"
        >
            <Trash className="w-4 h-4" />
        </button>
    </div>
);

export { ProjectItemAfter1, ProjectItemAfter2 };
