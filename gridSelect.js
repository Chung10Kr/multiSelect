/**
 * Created by 이충렬 on 2022-09-10 : init Commit
 * @Param1 {Object} 옵션
 * ex)
 * Option = {
 *  (필수) sTarget : Target Div ID ex) 'eGridSelect'

 * }
 */
class GridSelect {

    constructor(oOpt)
    {
        this.oOpt = oOpt;
        this.initEvent();
    }

    initEvent()
    {
        let sTarget = this.oOpt['sTarget'];
        let self = this;

        $(document).keyup(function(e){
            let sTarget = self.oOpt['sTarget'];
            self.onPress = false;
            $(`#${sTarget}`).css("cursor","default");
        });

        $(document).keydown(function(e){
            if(e.defaultPrevented) return false;
            if( self.onPress ) return false;
            let sCode = null;
            if(e.keyCode == 88){
                sCode = "X";
            }else if(e.keyCode == 89){
                sCode = "Y";
            }else if(e.keyCode == 66){
                self.startBlock=null;
                self.endBlock=null;
                sCode = "B";
            }else if(e.keyCode == 77){
                self.multiValue = [];
                self.multiElem = [];
                sCode = "M";
            }else if(e.keyCode == 67){// C
                if(self.sCode){
                    self._copy();
                }
            }else if(e.keyCode == 27){// ESC
                self._initStyle();
                self._initMode();
            }
            if( sCode ){
                self._initStyle();
                self.sCode = sCode;
                $(`#${sTarget}`).css("cursor","pointer");
                self.onPress = true;
            }
        })

        $(`#${sTarget} >tr >td`).click(async function(e) {
            if( self.sCode && self.onPress){
                e.stopImmediatePropagation();
                e.preventDefault();
                self._eventCall($(this));
                return;
            }
        });
    }

    _eventCall(e)
    {
        let sCode = this.sCode;
        if(sCode == "X"){
            this._getXData(e);
        }else if(sCode == "Y"){
            this._getYData(e);
        }else if(sCode == "M"){
            this._getMultiData(e);
        }else if(sCode == "B"){
            this._getBlockData(e);
        }
    }

    _getYData(e)
    {
        this._initStyle();
        let sValue = "";
        let sTarget = this.oOpt['sTarget'];
        let nIndex = $(e).index();

        let aElem = [];
        $(`#${sTarget}`).children("tr").each(function(i,e){
            aElem.push( $(e).children(`td:eq(${nIndex})`) );
        });
        aElem.forEach(function(e){
            sValue+=`${e.text()}\n`;
        });
        this._set(sValue,aElem);
    }

    _getXData(e)
    {
        this._initStyle();
        let sValue = "";
        let aElem = [];
        $(e).parents("tr").children("td").each(function(index,oTd){
            aElem.push($(oTd));
            sValue+=`${$(oTd).text()} `
        });
        this._set(sValue,aElem);
    }

    _getMultiData(e)
    {
        if( !this.multiElem ){
            this.multiElem = [];
        }

        let oSelected = $(e);
        if( oSelected.attr('data-origin-css') ){
            oSelected.css('background-color' , oSelected.attr('data-origin-css') );
            oSelected.removeAttr('data-origin-css');
            this.multiElem =  this.multiElem.filter(function(oElem){
                return oSelected[0] != $(oElem)[0];
            });
        }else{
            this.multiElem.push( oSelected );
        }

        let sValue = this.multiElem.map(function(e){
            return `${$(e).text()}`;
        }).join("\n");
        this._set(sValue,this.multiElem);
    };

    _getBlockData(e)
    {
        if( !this.startBlock ){
            this._initStyle();
            this.startBlock = $(e);
            this._set(null,[$(e)]);
            return false;
        }
        this.endBlock = $(e);

        let nStartTr = this.startBlock.parents("tr").index();
        let nStartTd = this.startBlock.index();
        let nEndTr = this.endBlock.parents("tr").index();
        let nEndTd = this.endBlock.index();

        let nTmp=0;
        if( nStartTr > nEndTr ){
            nTmp = nStartTr;
            nStartTr = nEndTr;
            nEndTr = nTmp;
        };
        if( nStartTd > nEndTd ){
            nTmp = nStartTd;
            nStartTd = nEndTd;
            nEndTd = nTmp;
        }

        let aElem = [];
        let sValue = "";
        let sTarget = this.oOpt['sTarget'];
        $(`#${sTarget}`).children("tr").slice(nStartTr,nEndTr+1).each(function(i,e){
            $(e).children("td").slice(nStartTd,nEndTd+1).each(function(i,e){
                aElem.push($(e));
                sValue+=`${$(e).text()}`;
                if( nStartTd != nEndTd ) sValue+=" ";
            });
            sValue+="\n";
        })
        this._set(sValue,aElem);

        this.startBlock = null;
        this.endBlock = null;
    }

    _initStyle()
    {
        if( !this.aElem ){
            return false;
        };
        let self = this;

        this.aElem.forEach(function(e,i){
            e.css('background-color' , e.attr('data-origin-css') );
            e.removeAttr('data-origin-css');
        });
        this.aElem = null;
    }

    _set(sValue,aElem)
    {
        aElem.forEach(function(e){
            if(!e.attr('data-origin-css')){
                e.attr('data-origin-css' , e.css('background-color'));
            };
            e.css('background-color',"#FF8C8C");
        });
        this.aElem = aElem;
        this.sValue = sValue;
    }

    _copy()
    {
        this.copyToClipboard( this.sValue );
        this._initStyle();
        this._initMode();
    }

    copyToClipboard(textToCopy)
    {
        // navigator clipboard api needs a secure context (https)
        if (navigator.clipboard && window.isSecureContext) {
            // navigator clipboard api method'
            return navigator.clipboard.writeText(textToCopy);
        } else {
            // text area method
            let textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            // make the textarea out of viewport
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((res, rej) => {
                document.execCommand('copy') ? res() : rej();
                textArea.remove();
            });
        }
    }

    _initMode()
    {
        let sTarget = this.oOpt['sTarget'];
        this.sCode = null;
        this.onPress = false;
        $(`#${sTarget}`).css("cursor","default");
    }

    /*
    * return Selected Value
    * */
    paste()
    {
        return (!this.sValue) ? null : this.sValue;
    }
}


