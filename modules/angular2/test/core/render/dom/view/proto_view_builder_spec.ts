import {
  describe,
  ddescribe,
  it,
  iit,
  xit,
  xdescribe,
  expect,
  beforeEach,
  el
} from 'angular2/test_lib';

import {
  DomElementSchemaRegistry
} from 'angular2/src/core/render/dom/schema/dom_element_schema_registry';
import {TemplateCloner} from 'angular2/src/core/render/dom/template_cloner';
import {ProtoViewBuilder} from 'angular2/src/core/render/dom/view/proto_view_builder';
import {ASTWithSource, AST} from 'angular2/src/core/change_detection/change_detection';
import {PropertyBindingType, ViewType, ViewEncapsulation} from 'angular2/src/core/render/api';
import {DOM} from 'angular2/src/core/dom/dom_adapter';
import {IS_DART} from '../../../../platform';

export function main() {
  function emptyExpr() { return new ASTWithSource(new AST(), 'empty', 'empty'); }

  describe('ProtoViewBuilder', () => {
    var builder;
    var templateCloner;
    beforeEach(() => {
      templateCloner = new TemplateCloner(-1);
      builder =
          new ProtoViewBuilder(DOM.createTemplate(''), ViewType.EMBEDDED, ViewEncapsulation.None);
    });

    if (!IS_DART) {
      describe('verification of properties', () => {

        it('should throw for unknown properties', () => {
          builder.bindElement(el('<div/>')).bindProperty('unknownProperty', emptyExpr());
          expect(() => builder.build(new DomElementSchemaRegistry(), templateCloner))
              .toThrowError(
                  `Can't bind to 'unknownProperty' since it isn't a known property of the '<div>' element and there are no matching directives with a corresponding property. If this is an attribute, make sure to prefix its name with \'attr.\'`);
        });

        it('should allow unknown properties if a directive uses it', () => {
          var binder = builder.bindElement(el('<div/>'));
          binder.bindDirective(0).bindProperty('someDirProperty', emptyExpr(), 'directiveProperty');
          binder.bindProperty('directiveProperty', emptyExpr());
          expect(() => builder.build(new DomElementSchemaRegistry(), templateCloner)).not.toThrow();
        });

        it('should throw for unknown host properties even if another directive uses it', () => {
          var binder = builder.bindElement(el('<div/>'));
          binder.bindDirective(0).bindProperty('someDirProperty', emptyExpr(), 'someDirProperty');
          binder.bindDirective(1).bindHostProperty('someDirProperty', emptyExpr());
          expect(() => builder.build(new DomElementSchemaRegistry()))
              .toThrowError(
                  `Can't bind to 'someDirProperty' since it isn't a known property of the '<div>' element`);
        });

        it('should allow unknown properties on custom elements', () => {
          var binder = builder.bindElement(el('<some-custom/>'));
          binder.bindProperty('unknownProperty', emptyExpr());
          expect(() => builder.build(new DomElementSchemaRegistry(), templateCloner)).not.toThrow();
        });

        it('should throw for unknown properties on custom elements if there is an ng component', () => {
          var binder = builder.bindElement(el('<some-custom/>'));
          binder.bindProperty('unknownProperty', emptyExpr());
          binder.setComponentId('someComponent');
          expect(() => builder.build(new DomElementSchemaRegistry(), templateCloner))
              .toThrowError(
                  `Can't bind to 'unknownProperty' since it isn't a known property of the '<some-custom>' element and there are no matching directives with a corresponding property. If this is an attribute, make sure to prefix its name with \'attr.\'`);
        });

      });
    } else {
      describe('verification of properties', () => {

        // TODO(tbosch): This is just a temporary test that makes sure that the dart server and
        // dart browser is in sync. Change this to "not contains notifyBinding"
        // when https://github.com/angular/angular/issues/3019 is solved.
        it('should not throw for unknown properties', () => {
          builder.bindElement(el('<div/>')).bindProperty('unknownProperty', emptyExpr());
          expect(() => builder.build(new DomElementSchemaRegistry(), templateCloner)).not.toThrow();
        });

      });
    }

    describe('property normalization', () => {
      it('should normalize "innerHtml" to "innerHTML"', () => {
        builder.bindElement(el('<div/>')).bindProperty('innerHtml', emptyExpr());
        var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
        expect(pv.elementBinders[0].propertyBindings[0].property).toEqual('innerHTML');
      });

      it('should normalize "tabindex" to "tabIndex"', () => {
        builder.bindElement(el('<div/>')).bindProperty('tabindex', emptyExpr());
        var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
        expect(pv.elementBinders[0].propertyBindings[0].property).toEqual('tabIndex');
      });

      it('should normalize "readonly" to "readOnly"', () => {
        builder.bindElement(el('<input/>')).bindProperty('readonly', emptyExpr());
        var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
        expect(pv.elementBinders[0].propertyBindings[0].property).toEqual('readOnly');
      });

      it('should normalize "class" to "className"', () => {
        builder.bindElement(el('<div></div>')).bindProperty('class', emptyExpr());
        var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
        expect(pv.elementBinders[0].propertyBindings[0].property).toEqual('className');
      });
    });

    describe('property binding', () => {
      describe('types', () => {
        it('should detect property names', () => {
          builder.bindElement(el('<div/>')).bindProperty('tabindex', emptyExpr());
          var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
          expect(pv.elementBinders[0].propertyBindings[0].type)
              .toEqual(PropertyBindingType.PROPERTY);
        });

        it('should detect attribute names', () => {
          builder.bindElement(el('<div/>')).bindProperty('attr.someName', emptyExpr());
          var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
          expect(pv.elementBinders[0].propertyBindings[0].type)
              .toEqual(PropertyBindingType.ATTRIBUTE);
        });

        it('should detect class names', () => {
          builder.bindElement(el('<div/>')).bindProperty('class.someName', emptyExpr());
          var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
          expect(pv.elementBinders[0].propertyBindings[0].type).toEqual(PropertyBindingType.CLASS);
        });

        it('should detect style names', () => {
          builder.bindElement(el('<div/>')).bindProperty('style.someName', emptyExpr());
          var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
          expect(pv.elementBinders[0].propertyBindings[0].type).toEqual(PropertyBindingType.STYLE);
        });

        it('should detect style units', () => {
          builder.bindElement(el('<div/>')).bindProperty('style.someName.someUnit', emptyExpr());
          var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
          expect(pv.elementBinders[0].propertyBindings[0].unit).toEqual('someUnit');
        });
      });

      it('should not create a property binding when there is already same directive property binding',
         () => {
           var binder = builder.bindElement(el('<div/>'));

           binder.bindProperty('tabindex', emptyExpr());
           binder.bindDirective(0).bindProperty('tabindex', emptyExpr(), 'tabindex');

           var pv = builder.build(new DomElementSchemaRegistry(), templateCloner);
           expect(pv.elementBinders[0].propertyBindings.length).toEqual(0);
         });
    });
  });
}
