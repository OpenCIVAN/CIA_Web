// ----------------------------------------------------------------------------
// Annotation 3D Rendering (VTK.js version)
// ----------------------------------------------------------------------------

import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';

import { annotationSystem } from '../collaboration/annotations.js';
import { getUserId } from '../collaboration/userManagement.js';
import { getSceneObjects } from './scene.js';

class AnnotationRenderer {
  constructor() {
    this.renderer = null;
    this.renderWindow = null;
    this.annotationActors = new Map(); // Maps annotationId -> actor
    this.actorToAnnotationId = new Map(); // Maps actor -> annotationId
    this.markerRadius = 0.05; // Default radius, adjustable
  }

  // Set the marker radius for all future annotations
  setMarkerRadius(radius) {
    this.markerRadius = radius;
    console.log('📍 Annotation marker radius set to:', radius);
  }

  // Get current marker radius
  getMarkerRadius() {
    return this.markerRadius;
  }

  initialize() {
    const { renderer, renderWindow } = getSceneObjects();
    
    if (!renderer || !renderWindow) {
      console.warn("Cannot initialize annotation renderer: scene not ready");
      return;
    }

    this.renderer = renderer;
    this.renderWindow = renderWindow;

    // Make sure annotation system is initialized first
    if (!annotationSystem.annotations) {
      annotationSystem.initialize();
    }

    // Load existing annotations
    const annotations = annotationSystem.getAllAnnotations();
    console.log(`📍 Loading ${annotations.length} existing annotations`);
    annotations.forEach(annotation => {
      this.createAnnotationMarker(annotation);
    });

    // Listen for new annotations
    annotationSystem.onAnnotationChange((action, annotation) => {
      if (action === 'added') {
        this.createAnnotationMarker(annotation);
      } else if (action === 'deleted') {
        this.removeAnnotationMarker(annotation.id);
      }
    });

    console.log('📍 Annotation renderer initialized');
  }

  createAnnotationMarker(annotation) {
    console.log('📍 Creating annotation marker:', annotation.id);
    console.log('   Position:', annotation.position);
    console.log('   Text:', annotation.text);
    console.log('   User:', annotation.userName);
    
    if (!this.renderer) {
      console.error('   ❌ No renderer available');
      return;
    }

    // Remove if already exists
    if (this.annotationActors.has(annotation.id)) {
      console.log('   Removing existing marker');
      this.removeAnnotationMarker(annotation.id);
    }

    try {
      // Create sphere source for the marker
      const sphereSource = vtkSphereSource.newInstance({
        radius: this.markerRadius,
        thetaResolution: 16,
        phiResolution: 16,
        center: [annotation.position.x, annotation.position.y, annotation.position.z]
      });
      console.log('   ✅ Sphere source created with radius:', this.markerRadius);

      // Create mapper
      const mapper = vtkMapper.newInstance();
      mapper.setInputConnection(sphereSource.getOutputPort());
      console.log('   ✅ Mapper created');

      // Create actor
      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      console.log('   ✅ Actor created');

      // Set color from user color (convert hex to RGB)
      const color = this.hexToRgb(annotation.userColor || '#FF6B6B');
      actor.getProperty().setColor(color.r / 255, color.g / 255, color.b / 255);
      actor.getProperty().setOpacity(0.8);
      console.log('   ✅ Color set:', color);

      // Store the mapping (use Maps instead of adding properties to actor)
      this.annotationActors.set(annotation.id, actor);
      this.actorToAnnotationId.set(actor, annotation.id);

      // Add to renderer
      this.renderer.addActor(actor);
      console.log('   ✅ Actor added to renderer');

      // Trigger render
      this.renderWindow.render();
      console.log('   ✅ Render triggered');
      console.log('   Total annotation markers:', this.annotationActors.size);

      if (!annotation.visible) {
        actor.setVisibility(false);
        console.log('   ⚠️ Annotation hidden (visible=false)');
      }
      
    } catch (error) {
      console.error('   ❌ Error creating annotation marker:', error);
      console.error('   Stack:', error.stack);
    }
  }

  removeAnnotationMarker(annotationId) {
    console.log('📍 Removing annotation marker:', annotationId);
    const actor = this.annotationActors.get(annotationId);
    
    if (actor) {
      // Remove from renderer
      this.renderer.removeActor(actor);
      
      // Clean up the mapper and source
      const mapper = actor.getMapper();
      if (mapper) {
        const inputConnection = mapper.getInputConnection(0);
        if (inputConnection) {
          const source = inputConnection.filter;
          if (source && source.delete) {
            source.delete();
          }
        }
        mapper.delete();
      }
      
      // Delete the actor
      actor.delete();
      
      // Remove from both maps
      this.actorToAnnotationId.delete(actor);
      this.annotationActors.delete(annotationId);
      
      // Trigger render
      this.renderWindow.render();
      console.log('   ✅ Marker removed, remaining:', this.annotationActors.size);
    } else {
      console.warn('   ⚠️ Marker not found:', annotationId);
    }
  }

  updateAnnotationVisibility(annotationId, visible) {
    const actor = this.annotationActors.get(annotationId);
    if (actor) {
      actor.setVisibility(visible);
      this.renderWindow.render();
      console.log(`📍 Annotation ${annotationId} visibility set to ${visible}`);
    }
  }

  getAnnotationIdFromActor(actor) {
    return this.actorToAnnotationId.get(actor);
  }

  highlightAnnotation(annotationId) {
    console.log('📍 Highlighting annotation:', annotationId);
    
    // Reset all markers to normal size
    this.annotationActors.forEach((actor, id) => {
      actor.setScale(1, 1, 1);
    });

    // Highlight selected
    const actor = this.annotationActors.get(annotationId);
    if (actor) {
      actor.setScale(1.5, 1.5, 1.5);
      console.log('   ✅ Annotation highlighted');
      
      // Optional: You could also change color temporarily
      // const property = actor.getProperty();
      // property.setColor(1, 1, 0); // Yellow highlight
    } else {
      console.warn('   ⚠️ Annotation not found:', annotationId);
    }

    this.renderWindow.render();
  }

  clearAllMarkers() {
    console.log('📍 Clearing all annotation markers');
    const count = this.annotationActors.size;
    
    this.annotationActors.forEach((actor, id) => {
      this.removeAnnotationMarker(id);
    });
    
    console.log(`   ✅ Cleared ${count} markers`);
  }

  // Get all annotation marker positions (for debugging)
  getAllMarkerPositions() {
    const positions = [];
    this.annotationActors.forEach((actor, id) => {
      const mapper = actor.getMapper();
      if (mapper) {
        const source = mapper.getInputConnection(0);
        if (source && source.filter) {
          const center = source.filter.getCenter();
          positions.push({ id, center });
        }
      }
    });
    return positions;
  }

  // Utility: Convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 107, b: 107 }; // Default red
  }

  // Debug method to show renderer info
  debugInfo() {
    console.log('📍 === Annotation Renderer Debug Info ===');
    console.log('Renderer:', !!this.renderer);
    console.log('RenderWindow:', !!this.renderWindow);
    console.log('Marker radius:', this.markerRadius);
    console.log('Total markers:', this.annotationActors.size);
    console.log('Marker positions:', this.getAllMarkerPositions());
    
    if (this.renderer) {
      const actors = this.renderer.getActors();
      console.log('Total actors in scene:', actors.length);
    }
  }
}

export const annotationRenderer = new AnnotationRenderer();